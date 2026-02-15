import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'

export default class KeyResultsDelete extends BaseCommand {
  public static override description = 'Delete a Productboard key result'
  public static override args = {
    id: Args.string({ description: 'Key result ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(KeyResultsDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/key-results/${encodeURIComponent(args.id)}`
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
