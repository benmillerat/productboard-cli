import { Args } from '@oclif/core'

import { commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { V2BaseCommand } from '../../../core/v2-base-command.js'

export default class V2EntitiesDelete extends V2BaseCommand {
  public static override description = 'Delete a Productboard v2 beta entity'

  public static override args = {
    id: Args.string({ description: 'Entity ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(V2EntitiesDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/v2/entities/${encodeURIComponent(args.id)}`
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
