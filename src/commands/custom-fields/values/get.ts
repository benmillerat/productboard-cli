import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { ValidationError } from '../../../core/errors.js'
import { outputResult } from '../../../core/output.js'
import { extractResource, parseKeyValuePairs, resourceQuietId } from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'

export default class CustomFieldsValuesGet extends BaseCommand {
  public static override description = 'Get a Productboard custom field value'

  public static override flags = {
    ...commonFlags,
    query: Flags.string({
      description: 'Lookup query parameter as key=value. Repeat for multiple values.',
      multiple: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(CustomFieldsValuesGet)
    const runtime = await this.initRuntime(flags)

    const query = parseKeyValuePairs(flags.query, '--query')
    if (Object.keys(query).length === 0) {
      throw new ValidationError('At least one --query key=value must be provided.')
    }

    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(
      '/hierarchy-entities/custom-fields-values/value',
      { query },
    )
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource),
      resource: 'custom-fields/values',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
