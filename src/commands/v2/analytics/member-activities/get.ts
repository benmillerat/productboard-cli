import { Flags } from '@oclif/core'

import { commonFlags } from '../../../../core/base-command.js'
import { outputResult } from '../../../../core/output.js'
import { parseKeyValuePairs } from '../../../../core/resource-helpers.js'
import { V2BaseCommand } from '../../../../core/v2-base-command.js'

export default class V2AnalyticsMemberActivitiesGet extends V2BaseCommand {
  public static override description = 'Get Productboard v2 beta analytics member activities'

  public static override flags = {
    ...commonFlags,
    query: Flags.string({
      description: 'API query parameter as key=value. Repeat for multiple values.',
      multiple: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(V2AnalyticsMemberActivitiesGet)
    const runtime = await this.initRuntime(flags)

    const query = parseKeyValuePairs(flags.query, '--query')
    const endpoint = '/v2/analytics/member-activities'
    const response = await runtime.client.get(endpoint, {
      query: Object.keys(query).length > 0 ? query : undefined,
    })

    outputResult(this.log, response, {
      format: runtime.output,
      quiet: runtime.quiet,
      resource: 'v2/analytics/member-activities',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
