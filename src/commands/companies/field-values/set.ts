import { Args, Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { extractResource, parseJsonObject, resourceQuietId } from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'

export default class CompaniesFieldValuesSet extends BaseCommand {
  public static override description = 'Set a Productboard company field value'

  public static override args = {
    companyId: Args.string({ description: 'Company ID', required: true }),
    companyCustomFieldId: Args.string({ description: 'Company custom field ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Value payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(CompaniesFieldValuesSet)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const endpoint = `/companies/${encodeURIComponent(args.companyId)}/custom-fields/${encodeURIComponent(args.companyCustomFieldId)}/value`
    const response = await runtime.client.put<ResourceResponse<ResourceRecord>>(endpoint, body)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.companyCustomFieldId),
    })
  }
}
