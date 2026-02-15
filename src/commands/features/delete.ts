import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'

export default class FeaturesDelete extends BaseCommand {
  public static override description = 'Delete a Productboard feature'

  public static override args = {
    id: Args.string({ description: 'Feature ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(FeaturesDelete)
    const runtime = await this.initRuntime(flags)

    await runtime.client.delete(`/features/${encodeURIComponent(args.id)}`)

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
