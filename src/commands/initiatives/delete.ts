import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { confirmOrThrow } from '../../core/confirm.js'

export default class InitiativesDelete extends BaseCommand {
  public static override description = 'Delete a Productboard initiative'
  public static override args = {
    id: Args.string({ description: 'Initiative ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(InitiativesDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/initiatives/${encodeURIComponent(args.id)}`

    await confirmOrThrow({
      yes: runtime.yes,
      noInput: runtime.noInput,
      prompt: `Delete initiative ${args.id}?`,
    })
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        id: args.id,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.id,
      },
    )
  }
}
