import { Args, Flags } from '@oclif/core'

import { commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'
import { listResources, parseKeyValuePairs } from '../../../../core/resource-helpers.js'
import type { ResourceRecord } from '../../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../../core/v2-base-command.js'

export default class V2NotesRelationshipsList extends V2BaseCommand {
  public static override description = 'List Productboard v2 beta note relationships'

  public static override args = {
    id: Args.string({ description: 'Note ID', required: true }),
  }

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
    const { args, flags } = await this.parse(V2NotesRelationshipsList)
    const runtime = await this.initRuntime(flags)

    const limit = flags.all ? 1000 : flags.limit
    const query = parseKeyValuePairs(flags.query, '--query')
    const endpoint = `/v2/notes/${encodeURIComponent(args.id)}/relationships`

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
      resource: 'v2/notes/relationships',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
