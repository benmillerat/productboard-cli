import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'

export default class NotesFollowersRemove extends BaseCommand {
  public static override description = 'Remove a follower from a Productboard note'

  public static override args = {
    noteId: Args.string({ description: 'Note ID', required: true }),
    email: Args.string({ description: 'Follower email', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(NotesFollowersRemove)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/notes/${encodeURIComponent(args.noteId)}/user-followers/${encodeURIComponent(args.email)}`
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        noteId: args.noteId,
        email: args.email,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.email,
      },
    )
  }
}
