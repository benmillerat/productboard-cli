import { Args } from '@oclif/core'

import { commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'
import { confirmOrThrow } from '../../../../core/confirm.js'
import { V2BaseCommand } from '../../../../core/v2-base-command.js'

export default class V2NotesRelationshipsDelete extends V2BaseCommand {
  public static override description = 'Delete a Productboard v2 beta note relationship'

  public static override args = {
    id: Args.string({ description: 'Note ID', required: true }),
    targetType: Args.string({ description: 'Relationship target type', required: true }),
    targetId: Args.string({ description: 'Relationship target ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(V2NotesRelationshipsDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/v2/notes/${encodeURIComponent(args.id)}/relationships/${encodeURIComponent(args.targetType)}/${encodeURIComponent(args.targetId)}`

    await confirmOrThrow({
      yes: runtime.yes,
      noInput: runtime.noInput,
      prompt: `Delete v2 note relationship ${args.targetType}/${args.targetId} from note ${args.id}?`,
    })
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        id: args.id,
        targetType: args.targetType,
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
