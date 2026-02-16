import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { releasesPresenter } from '../../core/presenters/releases.js'
import { extractResource, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class ReleasesGet extends BaseCommand {
  public static override description = 'Get a Productboard release'
  public static override args = {
    id: Args.string({ description: 'Release ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(ReleasesGet)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/releases/${encodeURIComponent(args.id)}`
    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(endpoint)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.id),
      presenter: releasesPresenter,
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
