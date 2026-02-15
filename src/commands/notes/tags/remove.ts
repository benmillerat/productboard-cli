import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'

export default class NotesTagsRemove extends BaseCommand {
  public static override description = 'Remove a Productboard tag link'

  public static override args = {
    noteId: Args.string({ description: 'Note ID', required: true }),
    tagName: Args.string({ description: 'Tag name', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(NotesTagsRemove)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/notes/${encodeURIComponent(args.noteId)}/tags/${encodeURIComponent(args.tagName)}`
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        noteId: args.noteId,
        tagName: args.tagName,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.tagName,
      },
    )
  }
}
