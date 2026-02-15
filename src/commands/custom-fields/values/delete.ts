import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { ValidationError } from '../../../core/errors.js'
import { outputResult } from '../../../core/output.js'
import { parseKeyValuePairs } from '../../../core/resource-helpers.js'

export default class CustomFieldsValuesDelete extends BaseCommand {
  public static override description = 'Delete a Productboard custom field value'

  public static override flags = {
    ...commonFlags,
    query: Flags.string({
      description: 'Lookup query parameter as key=value. Repeat for multiple values.',
      multiple: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(CustomFieldsValuesDelete)
    const runtime = await this.initRuntime(flags)

    const query = parseKeyValuePairs(flags.query, '--query')
    if (Object.keys(query).length === 0) {
      throw new ValidationError('At least one --query key=value must be provided.')
    }

    await runtime.client.delete('/hierarchy-entities/custom-fields-values/value', { query })

    outputResult(
      this.log,
      {
        success: true,
        query,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
      },
    )
  }
}
