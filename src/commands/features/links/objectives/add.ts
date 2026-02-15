import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'

export default class FeaturesLinksObjectivesAdd extends BaseCommand {
  public static override description = 'Add a Productboard objective link'

  public static override args = {
    featureId: Args.string({ description: 'Feature ID', required: true }),
    objectiveId: Args.string({ description: 'Objective ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(FeaturesLinksObjectivesAdd)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/features/${encodeURIComponent(args.featureId)}/links/objectives/${encodeURIComponent(args.objectiveId)}`
    await runtime.client.post(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        featureId: args.featureId,
        objectiveId: args.objectiveId,
      },
      {
        format: runtime.output,
        quiet: runtime.quiet,
        quietValue: args.objectiveId,
      },
    )
  }
}
