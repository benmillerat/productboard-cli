import { Flags } from '@oclif/core'

import { commonFlags } from '../../../core/base-command.js'
import { outputResult } from '../../../core/output.js'
import { extractResource, parseJsonObject } from '../../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../core/v2-base-command.js'

export default class V2EntitiesSearch extends V2BaseCommand {
  public static override description = 'Search Productboard v2 beta entities'

  public static override flags = {
    ...commonFlags,
    data: Flags.string({
      description: 'Search payload as JSON object',
      required: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(V2EntitiesSearch)
    const runtime = await this.initRuntime(flags)

    const body = parseJsonObject(flags.data, '--data')
    const endpoint = '/v2/entities/search'

    const response = await runtime.client.post<ResourceResponse<ResourceRecord>>(endpoint, body)
    const resource = extractResource(response)

    const quietValues = Array.isArray((resource as Record<string, unknown>).data)
      ? ((resource as Record<string, unknown>).data as unknown[])
          .map((item) =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { id?: unknown }).id === 'string'
              ? (item as { id: string }).id
              : undefined,
          )
          .filter((id): id is string => typeof id === 'string')
      : undefined

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: quietValues,
    })
  }
}
