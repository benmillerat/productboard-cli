import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'

export default class FeaturesLinksInitiativesAdd extends BaseCommand {
  public static override description = 'Add a Productboard initiative link'

  public static override args = {
    featureId: Args.string({ description: 'Feature ID', required: true }),
    initiativeId: Args.string({ description: 'Initiative ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(FeaturesLinksInitiativesAdd)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/features/${encodeURIComponent(args.featureId)}/links/initiatives/${encodeURIComponent(args.initiativeId)}`
    await runtime.client.post(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        featureId: args.featureId,
        initiativeId: args.initiativeId,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.initiativeId,
      },
    )
  }
}
