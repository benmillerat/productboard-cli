import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { confirmOrThrow } from '../../../core/confirm.js'

export default class CompaniesFieldsDelete extends BaseCommand {
  public static override description = 'Delete a Productboard company field'
  public static override args = {
    id: Args.string({ description: 'Company field ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(CompaniesFieldsDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/companies/custom-fields/${encodeURIComponent(args.id)}`

    await confirmOrThrow({
      yes: runtime.yes,
      noInput: runtime.noInput,
      prompt: `Delete company field ${args.id}?`,
    })
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
