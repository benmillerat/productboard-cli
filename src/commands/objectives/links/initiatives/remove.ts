import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'

export default class ObjectivesLinksInitiativesRemove extends BaseCommand {
  public static override description = 'Remove a Productboard initiative link'

  public static override args = {
    objectiveId: Args.string({ description: 'Objective ID', required: true }),
    initiativeId: Args.string({ description: 'Initiative ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(ObjectivesLinksInitiativesRemove)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/objectives/${encodeURIComponent(args.objectiveId)}/links/initiatives/${encodeURIComponent(args.initiativeId)}`
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        objectiveId: args.objectiveId,
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
