import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'
import { extractResource, resourceQuietId } from '../../core/resource-helpers.js'
import type { ResourceRecord, ResourceResponse } from '../../core/resource-helpers.js'

export default class ProductsGet extends BaseCommand {
  public static override description = 'Get a Productboard product'
  public static override args = {
    id: Args.string({ description: 'Product ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(ProductsGet)
    const runtime = await this.initRuntime(flags)

    const endpoint = `/products/${encodeURIComponent(args.id)}`
    const response = await runtime.client.get<ResourceResponse<ResourceRecord>>(endpoint)
    const resource = extractResource(response)

    outputResult(this.log, resource, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: resourceQuietId(resource, args.id),
      resource: 'products',
      wide: runtime.wide,
      resultsOnly: runtime.resultsOnly,
    })
  }
}
