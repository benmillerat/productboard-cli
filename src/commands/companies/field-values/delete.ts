import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { confirmOrThrow } from '../../../core/confirm.js'

export default class CompaniesFieldValuesDelete extends BaseCommand {
  public static override description = 'Delete a Productboard company field value'

  public static override args = {
    companyId: Args.string({ description: 'Company ID', required: true }),
    companyCustomFieldId: Args.string({ description: 'Company custom field ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(CompaniesFieldValuesDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/companies/${encodeURIComponent(args.companyId)}/custom-fields/${encodeURIComponent(args.companyCustomFieldId)}/value`

    await confirmOrThrow({
      yes: runtime.yes,
      noInput: runtime.noInput,
      prompt: `Delete company field value ${args.companyCustomFieldId} for company ${args.companyId}?`,
    })
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        companyId: args.companyId,
        companyCustomFieldId: args.companyCustomFieldId,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.companyCustomFieldId,
      },
    )
  }
}
