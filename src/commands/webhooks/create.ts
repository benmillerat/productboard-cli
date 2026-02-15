import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { extractResource, parseJsonObject, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class WebhooksCreate extends BaseCommand {
  public static override description = 'Create a Productboard webhook'
  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Request payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const {  flags } = await this.parse(WebhooksCreate)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const endpoint = '/webhooks'

    const response = await runtime.client.post<ResourceResponse<ResourceRecord>>(endpoint, body)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource),
    })
  }
}
