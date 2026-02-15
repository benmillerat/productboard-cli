import { Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { ValidationError } from '../../core/errors.js'
import { outputResult } from '../../core/output.js'

interface Feature {
  id: string
  name?: string
  description?: string
  status?: {
    name?: string
  }
  [key: string]: unknown
}

interface FeaturesResponse {
  data?: Feature[]
  links?: {
    next?: string
  }
}

function parseQueryFilters(rawFilters: string[]): Record<string, string> {
  const query: Record<string, string> = {}

  for (const filter of rawFilters) {
    const separatorIndex = filter.indexOf('=')
    if (separatorIndex <= 0 || separatorIndex === filter.length - 1) {
      throw new ValidationError(`Invalid --filter value "${filter}". Expected key=value.`)
    }

    const key = filter.slice(0, separatorIndex).trim()
    const value = filter.slice(separatorIndex + 1).trim()

    if (!key || !value) {
      throw new ValidationError(`Invalid --filter value "${filter}". Expected key=value.`)
    }

    query[key] = value
  }

  return query
}

function matchesClientFilters(feature: Feature, search?: string, status?: string): boolean {
  if (search) {
    const haystack = `${feature.name ?? ''} ${feature.description ?? ''}`.toLowerCase()
    if (!haystack.includes(search.toLowerCase())) {
      return false
    }
  }

  if (status) {
    const featureStatus = feature.status?.name?.toLowerCase() ?? ''
    if (featureStatus !== status.toLowerCase()) {
      return false
    }
  }

  return true
}

export default class FeaturesList extends BaseCommand {
  public static override description = 'List Productboard features'

  public static override flags = {
    ...commonFlags,
    limit: Flags.integer({
      description: 'Maximum number of matching features to return',
      default: 100,
      min: 1,
    }),
    all: Flags.boolean({
      description: 'Fetch up to 1000 matching features',
      default: false,
    }),
    search: Flags.string({
      description: 'Client-side case-insensitive search in feature name and description',
    }),
    status: Flags.string({
      description: 'Client-side case-insensitive exact match on feature status name',
    }),
    filter: Flags.string({
      description: 'API query filter as key=value. Repeat for multiple filters.',
      multiple: true,
    }),
  }

  public override async run(): Promise<void> {
    const { flags } = await this.parse(FeaturesList)
    const runtime = await this.initRuntime(flags)

    const limit = flags.all ? 1000 : flags.limit
    const query = parseQueryFilters(flags.filter ?? [])

    const matches = (feature: Feature): boolean =>
      matchesClientFilters(feature, flags.search, flags.status)

    const items: Feature[] = []
    let nextUrl: string | null = null

    while (items.length < limit) {
      const response: FeaturesResponse = nextUrl
        ? await runtime.client.request<FeaturesResponse>('GET', '/features', {
            absoluteUrl: nextUrl,
          })
        : await runtime.client.get<FeaturesResponse>('/features', {
            query: Object.keys(query).length > 0 ? query : undefined,
          })

      const pageItems = Array.isArray(response.data) ? response.data : []
      for (const feature of pageItems) {
        if (matches(feature)) {
          items.push(feature)
        }

        if (items.length >= limit) {
          break
        }
      }

      const candidateNext: string | null = response.links?.next ?? null
      if (!candidateNext || items.length >= limit) {
        nextUrl = candidateNext
        break
      }

      nextUrl = candidateNext
    }

    const payload = {
      data: items,
      count: items.length,
      hasMore: Boolean(nextUrl) && items.length >= limit,
      next: nextUrl,
    }

    const tableData = items.map((feature) => ({
      id: feature.id,
      name: feature.name ?? '',
      status: feature.status?.name ?? '',
    }))

    outputResult(this.log, runtime.output === 'table' ? tableData : payload, {
      format: runtime.output,
      quiet: runtime.quiet,
      quietValue: items.map((feature) => feature.id),
    })
  }
}
