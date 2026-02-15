import { Flags } from '@oclif/core'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

import { saveToken } from '../../core/auth.js'
import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { AuthError } from '../../core/errors.js'
import { outputResult } from '../../core/output.js'

export default class AuthLogin extends BaseCommand {
  public static override description = 'Store Productboard API token in your system keychain'

  public static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --profile work',
  ]

  public static override flags = {
    ...commonFlags,
    token: Flags.string({
      description: 'Token to store. If omitted, command prompts interactively.',
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin)
    const outputConfig = await this.initOutput(flags)

    const token = flags.token ?? (await this.promptForToken())
    if (!token.trim()) {
      throw new AuthError('Token cannot be empty.')
    }

    await saveToken(token, outputConfig.profileName)

    outputResult(
      this.log,
      {
        success: true,
        profile: outputConfig.profileName,
        message: 'Token stored in keychain.',
      },
      {
        format: outputConfig.output,
        quiet: outputConfig.quiet,
        quietValue: outputConfig.profileName,
      },
    )
  }

  private async promptForToken(): Promise<string> {
    const rl = createInterface({ input, output })
    try {
      return await rl.question('Productboard API token: ')
    } finally {
      rl.close()
    }
  }
}
