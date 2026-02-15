import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { extractResource, parseJsonObject, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class FeedbackFormsSubmit extends BaseCommand {
  public static override description = 'Submit a Productboard feedback form'

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Feedback form payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(FeedbackFormsSubmit)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const response = await runtime.client.post<ResourceResponse<ResourceRecord>>('/feedback-forms', body)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource),
    })
  }
}
