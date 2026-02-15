import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { ValidationError } from '../../core/errors.js'
import { outputResult } from '../../core/output.js'

interface Feature {
  id: string
  [key: string]: unknown
}

interface FeatureResponse extends Partial<Feature> {
  data?: Feature
}

export default class FeaturesCreate extends BaseCommand {
  public static override description = 'Create a Productboard feature'

  public static override flags = {
    ...commonFlags,
    name: Flags.string({ description: 'Feature name', required: true }),
    description: Flags.string({ description: 'Feature description', required: true }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(FeaturesCreate)
    const runtime = await this.initRuntime(flags)

    if (!flags.name.trim()) {
      throw new ValidationError('Feature name cannot be empty.')
    }

    if (!flags.description.trim()) {
      throw new ValidationError('Feature description cannot be empty.')
    }

    const response = await runtime.client.post<FeatureResponse>('/features', {
      data: {
        name: flags.name,
        description: flags.description,
      },
    })

    const feature: Partial<Feature> = response.data ?? response

    outputResult(this.log, feature, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: feature.id,
    })
  }
}
