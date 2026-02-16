import { Args } from '@oclif/core'

import { commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'
import { confirmOrThrow } from '../../../../core/confirm.js'
import { V2BaseCommand } from '../../../../core/v2-base-command.js'

export default class V2EntitiesRelationshipsDelete extends V2BaseCommand {
  public static override description = 'Delete a Productboard v2 beta entity relationship'

  public static override args = {
    id: Args.string({ description: 'Entity ID', required: true }),
    type: Args.string({ description: 'Relationship type', required: true }),
    targetId: Args.string({ description: 'Relationship target ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(V2EntitiesRelationshipsDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/v2/entities/${encodeURIComponent(args.id)}/relationships/${encodeURIComponent(args.type)}/${encodeURIComponent(args.targetId)}`

    await confirmOrThrow({
      yes: runtime.yes,
      noInput: runtime.noInput,
      prompt: `Delete v2 entity relationship ${args.type}/${args.targetId} from entity ${args.id}?`,
    })
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        id: args.id,
        type: args.type,
        targetId: args.targetId,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.targetId,
      },
    )
  }
}
