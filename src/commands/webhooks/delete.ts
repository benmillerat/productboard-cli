import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'

export default class WebhooksDelete extends BaseCommand {
  public static override description = 'Delete a Productboard webhook'
  public static override args = {
    id: Args.string({ description: 'Webhook ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(WebhooksDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/webhooks/${encodeURIComponent(args.id)}`
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
