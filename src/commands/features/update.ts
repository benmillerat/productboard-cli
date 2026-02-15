import { Args, Flags } from '@oclif/core'

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

function parsePatchData(raw: string | undefined): Record<string, unknown> {
  if (!raw) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new ValidationError('Invalid JSON provided in --data.')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ValidationError('--data must be a JSON object.')
  }

  return parsed as Record<string, unknown>
}

export default class FeaturesUpdate extends BaseCommand {
  public static override description = 'Update a Productboard feature'

  public static override args = {
    id: Args.string({ description: 'Feature ID', required: true }),
  }

  public static override flags = {
    ...commonFlags,
    name: Flags.string({ description: 'Updated feature name' }),
    description: Flags.string({ description: 'Updated feature description' }),
    data: Flags.string({ description: 'Additional patch payload as JSON object' }),
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(FeaturesUpdate)
    const runtime = await this.initRuntime(flags)

    const patchData = parsePatchData(flags.data)

    if (typeof flags.name === 'string') {
      if (!flags.name.trim()) {
        throw new ValidationError('Feature name cannot be empty.')
      }

      patchData.name = flags.name
    }

    if (typeof flags.description === 'string') {
      if (!flags.description.trim()) {
        throw new ValidationError('Feature description cannot be empty.')
      }

      patchData.description = flags.description
    }

    if (Object.keys(patchData).length === 0) {
      throw new ValidationError('Nothing to update. Provide --name, --description, or --data.')
    }

    const response = await runtime.client.patch<FeatureResponse>(
      `/features/${encodeURIComponent(args.id)}`,
      { data: patchData },
    )

    const feature: Partial<Feature> = response.data ?? response

    outputResult(this.log, feature, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: feature.id ?? args.id,
    })
  }
}
