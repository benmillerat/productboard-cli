import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { extractResource, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class CustomFieldsGet extends BaseCommand {
  public static override description = 'Get a Productboard custom field'
  public static override args = {
    id: Args.string({ description: 'Custom field ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(CustomFieldsGet)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/hierarchy-entities/custom-fields/${encodeURIComponent(args.id)}`
    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(endpoint)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.id),
      resource: 'custom-fields',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
