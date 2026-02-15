import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'

export default class InitiativesLinksFeaturesAdd extends BaseCommand {
  public static override description = 'Add a Productboard feature link'

  public static override args = {
    initiativeId: Args.string({ description: 'Initiative ID', required: true }),
    featureId: Args.string({ description: 'Feature ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(InitiativesLinksFeaturesAdd)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/initiatives/${encodeURIComponent(args.initiativeId)}/links/features/${encodeURIComponent(args.featureId)}`
    await runtime.client.post(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        initiativeId: args.initiativeId,
        featureId: args.featureId,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.featureId,
      },
    )
  }
}
