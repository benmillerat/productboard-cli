import { describe, expect, it, vi } from 'vitest'

import {
  KEYCHAIN_SERVICE,
  requireToken,
  resolveTokenWithSource,
  saveToken,
  tokenExists,
  type KeychainAdapter,
} from '../../src/core/auth.js'
import { AuthError } from '../../src/core/errors.js'

function createKeychainAdapter(initialToken: string | null = null): KeychainAdapter {
  let token = initialToken

  return {
    async getPassword(service: string, account: string): Promise<string | null> {
      expect(service).toBe(KEYCHAIN_SERVICE)
      expect(account).toBe('token:default')
      return token
    },
    async setPassword(service: string, account: string, value: string): Promise<void> {
      expect(service).toBe(KEYCHAIN_SERVICE)
      expect(account).toBe('token:default')
      token = value
    },
    async deletePassword(service: string, account: string): Promise<boolean> {
      expect(service).toBe(KEYCHAIN_SERVICE)
      expect(account).toBe('token:default')
      const hadToken = token !== null
      token = null
      return hadToken
    },
  }
}

describe('core/auth', () => {
  it('resolves token precedence flag > env > keychain', async () => {
    const keychain = createKeychainAdapter('from-keychain')

    await expect(
      resolveTokenWithSource({
        flagToken: ' from-flag ',
        envToken: 'from-env',
        profile: 'default',
        keychain,
      }),
    ).resolves.toEqual({ token: 'from-flag', source: 'flag' })

    await expect(
      resolveTokenWithSource({
        envToken: ' from-env ',
        profile: 'default',
        keychain,
      }),
    ).resolves.toEqual({ token: 'from-env', source: 'env' })

    await expect(
      resolveTokenWithSource({
        profile: 'default',
        keychain,
      }),
    ).resolves.toEqual({ token: 'from-keychain', source: 'keychain' })
  })

  it('throws when requireToken cannot resolve a token', async () => {
    const keychain = createKeychainAdapter(null)

    await expect(
      requireToken({
        profile: 'default',
        keychain,
      }),
    ).rejects.toBeInstanceOf(AuthError)
  })

  it('saves trimmed tokens and checks existence', async () => {
    const keychain = createKeychainAdapter(null)

    await saveToken('   abc123   ', 'default', keychain)
    await expect(tokenExists('default', keychain)).resolves.toBe(true)
  })

  it('rejects empty saveToken values', async () => {
    const keychain = createKeychainAdapter(null)
    await expect(saveToken('   ', 'default', keychain)).rejects.toBeInstanceOf(AuthError)
  })

  it('can be used with spy adapters', async () => {
    const adapter: KeychainAdapter = {
      getPassword: vi.fn(async () => 'token'),
      setPassword: vi.fn(async () => undefined),
      deletePassword: vi.fn(async () => true),
    }

    await resolveTokenWithSource({ profile: 'default', keychain: adapter })
    expect(adapter.getPassword).toHaveBeenCalledTimes(1)
  })
})
