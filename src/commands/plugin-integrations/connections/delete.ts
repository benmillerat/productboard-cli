import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { confirmOrThrow } from '../../../core/confirm.js'

export default class PluginIntegrationsConnectionsDelete extends BaseCommand {
  public static override description = 'Delete a Productboard plugin integration connection'

  public static override args = {
    id: Args.string({ description: 'Plugin integration ID', required: true }),
    featureId: Args.string({ description: 'Feature ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(PluginIntegrationsConnectionsDelete)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/plugin-integrations/${encodeURIComponent(args.id)}/connections/${encodeURIComponent(args.featureId)}`

    await confirmOrThrow({
      yes: runtime.yes,
      noInput: runtime.noInput,
      prompt: `Delete plugin integration connection ${args.featureId} from integration ${args.id}?`,
    })
    await runtime.client.delete(endpoint)

    outputResult(
      this.log,
      {
        success: true,
        id: args.id,
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
