import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { listResources, parseKeyValuePairs } from '../../core/resource-helpers.js'
import type { ResourceRecord } from '../../core/resource-helpers.js'

export default class ReleasesList extends BaseCommand {
  public static override description = 'List Productboard releases'
  public static override flags = {
    ...commonFlags,
    limit: Flags.integer({
      description: 'Maximum number of records to return',
      default: 100,
      min: 1,
    }),
    all: Flags.boolean({
      description: 'Fetch up to 1000 records',
      default: false,
    }),
    query: Flags.string({
      description: 'API query parameter as key=value. Repeat for multiple values.',
      multiple: true,
    }),
  }

  public override async run(): Promise<void> {
    const {  flags } = await this.parse(ReleasesList)
    const runtime = await this.initRuntime(flags)

    const limit = flags.all ? 1000 : flags.limit
    const query = parseKeyValuePairs(flags.query, '--query')
    const endpoint = '/releases'

    const result = await listResources<ResourceRecord>(runtime.client, endpoint, {
      limit,
      query: Object.keys(query).length > 0 ? query : undefined,
    })

    const quietIds = result.items
      .map((item) => (typeof item.id === 'string' ? item.id : undefined))
      .filter((id): id is string => typeof id === 'string')

    const payload = {
      data: result.items,
      count: result.count,
      hasMore: result.hasMore,
      next: result.next,
    }

    outputResult(this.log, payload, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: quietIds,
      resource: 'releases',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
