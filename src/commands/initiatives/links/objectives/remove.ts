import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'

export default class InitiativesLinksObjectivesRemove extends BaseCommand {
  public static override description = 'Remove a Productboard objective link'

  public static override args = {
    initiativeId: Args.string({ description: 'Initiative ID', required: true }),
    objectiveId: Args.string({ description: 'Objective ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(InitiativesLinksObjectivesRemove)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/initiatives/${encodeURIComponent(args.initiativeId)}/links/objectives/${encodeURIComponent(args.objectiveId)}`
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        initiativeId: args.initiativeId,
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
