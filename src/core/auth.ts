import keytar from 'keytar'

import { AuthError } from './errors.js'

export const KEYCHAIN_SERVICE = 'com.benmillerat.productboard-cli'

export interface KeychainAdapter {
  getPassword: (service: string, account: string) => Promise<string | null>
  setPassword: (service: string, account: string, password: string) => Promise<void>
  deletePassword: (service: string, account: string) => Promise<boolean>
}

const defaultKeychain: KeychainAdapter = {
  getPassword: (service, account) => keytar.getPassword(service, account),
  setPassword: (service, account, token) => keytar.setPassword(service, account, token),
  deletePassword: (service, account) => keytar.deletePassword(service, account),
}

function accountName(profile: string): string {
  return `token:${profile}`
}

export interface ResolveTokenOptions {
  flagToken?: string
  envToken?: string | undefined
  profile: string
  keychain?: KeychainAdapter
}

export type TokenSource = 'flag' | 'env' | 'keychain' | null

export interface ResolvedToken {
  token: string | null
  source: TokenSource
}

export async function resolveTokenWithSource(options: ResolveTokenOptions): Promise<ResolvedToken> {
  const fromFlag = options.flagToken?.trim()
  if (fromFlag) {
    return { token: fromFlag, source: 'flag' }
  }

  const fromEnv = options.envToken?.trim()
  if (fromEnv) {
    return { token: fromEnv, source: 'env' }
  }

  const adapter = options.keychain ?? defaultKeychain
  const storedToken = await adapter.getPassword(KEYCHAIN_SERVICE, accountName(options.profile))
  return {
    token: storedToken?.trim() ?? null,
    source: storedToken ? 'keychain' : null,
  }
}

export async function resolveToken(options: ResolveTokenOptions): Promise<string | null> {
  const resolved = await resolveTokenWithSource(options)
  return resolved.token
}

export async function requireToken(options: ResolveTokenOptions): Promise<string> {
  const token = await resolveToken(options)
  if (!token) {
    throw new AuthError(
      'No Productboard API token found. Run `pb auth login` or set PRODUCTBOARD_API_TOKEN.',
    )
  }

  return token
}

export async function saveToken(
  token: string,
  profile: string,
  keychain: KeychainAdapter = defaultKeychain,
): Promise<void> {
  const trimmed = token.trim()
  if (!trimmed) {
    throw new AuthError('Token cannot be empty.')
  }

  await keychain.setPassword(KEYCHAIN_SERVICE, accountName(profile), trimmed)
}

export async function removeToken(
  profile: string,
  keychain: KeychainAdapter = defaultKeychain,
): Promise<boolean> {
  return keychain.deletePassword(KEYCHAIN_SERVICE, accountName(profile))
}

export async function tokenExists(
  profile: string,
  keychain: KeychainAdapter = defaultKeychain,
): Promise<boolean> {
  const token = await keychain.getPassword(KEYCHAIN_SERVICE, accountName(profile))
  return typeof token === 'string' && token.trim().length > 0
}
