import { Args, Flags } from '@oclif/core'

import { commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'
import {
  extractResource,
  parseJsonObject,
  resourceQuietId,
} from '../../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../../core/v2-base-command.js'

export default class V2EntitiesRelationshipsSetParent extends V2BaseCommand {
  public static override description = 'Set Productboard v2 beta entity parent relationship'

  public static override args = {
    id: Args.string({ description: 'Entity ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Request payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(V2EntitiesRelationshipsSetParent)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const endpoint = `/v2/entities/${encodeURIComponent(args.id)}/relationships/parent`

    const response = await runtime.client.put<ResourceResponse<ResourceRecord>>(endpoint, body)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource),
    })
  }
}
