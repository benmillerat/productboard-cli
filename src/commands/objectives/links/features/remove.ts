import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'

export default class ObjectivesLinksFeaturesRemove extends BaseCommand {
  public static override description = 'Remove a Productboard feature link'

  public static override args = {
    objectiveId: Args.string({ description: 'Objective ID', required: true }),
    featureId: Args.string({ description: 'Feature ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(ObjectivesLinksFeaturesRemove)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/objectives/${encodeURIComponent(args.objectiveId)}/links/features/${encodeURIComponent(args.featureId)}`
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        objectiveId: args.objectiveId,
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
