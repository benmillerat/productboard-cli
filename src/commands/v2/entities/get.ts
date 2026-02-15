import { Args } from '@oclif/core'

import { commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { extractResource, resourceQuietId } from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../core/v2-base-command.js'

export default class V2EntitiesGet extends V2BaseCommand {
  public static override description = 'Get a Productboard v2 beta entity'

  public static override args = {
    id: Args.string({ description: 'Entity ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(V2EntitiesGet)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/v2/entities/${encodeURIComponent(args.id)}`
    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(endpoint)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.id),
    })
  }
}
