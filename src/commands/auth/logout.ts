import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { removeToken } from '../../core/auth.js'
import { outputResult } from '../../core/output.js'

export default class AuthLogout extends BaseCommand {
  public static override description = 'Remove Productboard API token from keychain'

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogout)
    const outputConfig = await this.initOutput(flags)

    const removed = await removeToken(outputConfig.profileName)

    outputResult(
      this.log,
      {
        success: removed,
        profile: outputConfig.profileName,
        message: removed ? 'Token removed from keychain.' : 'No token was stored for this profile.',
      },
      {
        format: outputConfig.output,
        quiet: outputConfig.quiet,
        quietValue: outputConfig.profileName,
      },
    )
  }
}
