import { Args, Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { ValidationError } from '../../../core/errors.js'
import { outputResult } from '../../../core/output.js'
import { parseJsonObject } from '../../../core/resource-helpers.js'

export default class NotesFollowersAddBulk extends BaseCommand {
  public static override description = 'Add followers to a Productboard note'

  public static override args = {
    noteId: Args.string({ description: 'Note ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
    email: Flags.string({
      description: 'Follower email. Repeat for multiple emails.',
      multiple: true,
    }),
    data: Flags.string({
      description: 'Full request payload as JSON object (overrides --email)',
    }),
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(NotesFollowersAddBulk)
    const runtime = await this.initRuntime(flags)

    const emails = (flags.email ?? [])
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    const body = flags.data
      ? parseJsonObject(flags.data, '--data')
      : emails.length > 0
        ? { data: { emails } }
        : undefined

    if (!body) {
      throw new ValidationError('Provide at least one --email value or --data.')
    }

    const endpoint = `/notes/${encodeURIComponent(args.noteId)}/user-followers`
    await runtime.client.post(endpoint, body)

    outputResult(
      this.log,
      {
        success: true,
        noteId: args.noteId,
        emails,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: emails.length > 0 ? emails : args.noteId,
      },
    )
  }
}
