import { resolveTokenWithSource, tokenExists } from '../../core/auth.js'
import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'

export default class AuthStatus extends BaseCommand {
  public static override description = 'Show current Productboard authentication state'

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus)
    const outputConfig = await this.initOutput(flags)

    const resolved = await resolveTokenWithSource({
      flagToken: flags.token,
      envToken: process.env.PRODUCTBOARD_API_TOKEN,
      profile: outputConfig.profileName,
    })

    const keychainHasToken = await tokenExists(outputConfig.profileName)

    const payload = {
      authenticated: Boolean(resolved.token),
      profile: outputConfig.profileName,
      source: resolved.source,
      envTokenPresent:
        typeof process.env.PRODUCTBOARD_API_TOKEN === 'string' &&
        process.env.PRODUCTBOARD_API_TOKEN.trim().length > 0,
      keychainTokenPresent: keychainHasToken,
    }

    outputResult(this.log, payload, {
      format: outputConfig.output,
      quiet: outputConfig.quiet,
      quietValue: payload.authenticated ? 'authenticated' : 'unauthenticated',
    })
  }
}
