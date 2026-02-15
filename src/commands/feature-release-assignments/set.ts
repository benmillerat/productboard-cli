import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { extractResource, parseJsonObject, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class FeatureReleaseAssignmentsSet extends BaseCommand {
  public static override description = 'Set a Productboard feature release assignment'

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Assignment payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(FeatureReleaseAssignmentsSet)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const response = await runtime.client.put<ResourceResponse<ResourceRecord>>(
      '/feature-release-assignments/assignment',
      body,
    )
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource),
    })
  }
}
