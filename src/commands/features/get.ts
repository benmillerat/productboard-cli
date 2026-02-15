import { Args } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { outputResult } from '../../core/output.js'

interface Feature {
  id: string
  [key: string]: unknown
}

interface FeatureResponse extends Partial<Feature> {
  data?: Feature
}

export default class FeaturesGet extends BaseCommand {
  public static override description = 'Get a Productboard feature by ID'

  public static override args = {
    id: Args.string({ description: 'Feature ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(FeaturesGet)
    const runtime = await this.initRuntime(flags)

    const response = await runtime.client.get<FeatureResponse>(
      `/features/${encodeURIComponent(args.id)}`,
    )
    const feature: Partial<Feature> = response.data ?? response

    outputResult(this.log, feature, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: feature.id ?? args.id,
    })
  }
}
