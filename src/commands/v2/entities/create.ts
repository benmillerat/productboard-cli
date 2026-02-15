import { Flags } from '@oclif/core'

import { commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import {
  extractResource,
  parseJsonObject,
  resourceQuietId,
} from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../core/v2-base-command.js'

export default class V2EntitiesCreate extends V2BaseCommand {
  public static override description = 'Create a Productboard v2 beta entity'

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Request payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(V2EntitiesCreate)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const endpoint = '/v2/entities'

    const response = await runtime.client.post<ResourceResponse<ResourceRecord>>(endpoint, body)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource),
    })
  }
}
