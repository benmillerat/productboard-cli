import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { extractResource, resourceQuietId } from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'

export default class CompaniesFieldValuesGet extends BaseCommand {
  public static override description = 'Get a Productboard company field value'

  public static override args = {
    companyId: Args.string({ description: 'Company ID', required: true }),
    companyCustomFieldId: Args.string({ description: 'Company custom field ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(CompaniesFieldValuesGet)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/companies/${encodeURIComponent(args.companyId)}/custom-fields/${encodeURIComponent(args.companyCustomFieldId)}/value`
    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(endpoint)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.companyCustomFieldId),
    })
  }
}
