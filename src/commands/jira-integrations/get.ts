import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { extractResource, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class JiraIntegrationsGet extends BaseCommand {
  public static override description = 'Get a Productboard Jira integration'
  public static override args = {
    id: Args.string({ description: 'Jira integration ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(JiraIntegrationsGet)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/jira-integrations/${encodeURIComponent(args.id)}`
    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(endpoint)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.id),
      resource: 'jira-integrations',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
