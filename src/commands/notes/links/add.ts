import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'

export default class NotesLinksAdd extends BaseCommand {
  public static override description = 'Add a Productboard note link'

  public static override args = {
    noteId: Args.string({ description: 'Note ID', required: true }),
    entityId: Args.string({ description: 'Linked entity ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(NotesLinksAdd)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/notes/${encodeURIComponent(args.noteId)}/links/${encodeURIComponent(args.entityId)}`
    await runtime.client.post(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        noteId: args.noteId,
        entityId: args.entityId,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.entityId,
      },
    )
  }
}
