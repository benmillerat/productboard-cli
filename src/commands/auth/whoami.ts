import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { resolveTokenWithSource } from '../../core/auth.js'
import { outputResult } from '../../core/output.js'
import { AuthError } from '../../core/errors.js'

interface JwtPayload {
  sub?: string
  user_id?: number
  space_id?: string
  role?: string
  iss?: string
  aud?: string
  iat?: number
  [key: string]: unknown
}

function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new AuthError('Token does not appear to be a valid JWT.')
  }

  try {
    const segment = parts[1]
    if (!segment) {
      throw new AuthError('Token has an empty payload segment.')
    }

    const payload = Buffer.from(segment, 'base64url').toString('utf8')
    return JSON.parse(payload) as JwtPayload
  } catch {
    throw new AuthError('Failed to decode token payload.')
  }
}

export default class AuthWhoAmI extends BaseCommand {
  public static override description = 'Decode and display the current Productboard API token identity'

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(AuthWhoAmI)
    const outputConfig = await this.initOutput(flags)

    const resolved = await resolveTokenWithSource({
      flagToken: flags.token,
      envToken: process.env.PRODUCTBOARD_API_TOKEN,
      profile: outputConfig.profileName,
    })

    if (!resolved.token) {
      throw new AuthError('No token found. Run `pb auth login` first.')
    }

    const payload = decodeJwtPayload(resolved.token)

    const identity = {
      userId: payload.user_id ?? payload.sub ?? 'unknown',
      spaceId: payload.space_id ?? 'unknown',
      role: payload.role ?? 'unknown',
      issuer: payload.iss ?? 'unknown',
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown',
      source: resolved.source,
      profile: outputConfig.profileName,
    }

    outputResult(this.log, identity, {
      format: outputConfig.output,
      quiet: outputConfig.quiet,
      quietValue: String(identity.userId),
    })
  }
}
