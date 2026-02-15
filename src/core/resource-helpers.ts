import type { HttpClient } from './http.js'
import { ValidationError } from './errors.js'
import { paginateWithLinks, type LinksPage, type PaginationResult } from './pagination.js'

export interface ResourceRecord {
  id?: string
  [key: string]: unknown
}

export interface ResourceResponse<T extends ResourceRecord> extends ResourceRecord {
  data?: T
}

export interface ResourceListResponse<T> extends LinksPage<T> {
  data?: T[]
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseKeyValuePairs(
  entries: string[] | undefined,
  optionName: string,
): Record<string, string> {
  const output: Record<string, string> = {}

  for (const entry of entries ?? []) {
    const separatorIndex = entry.indexOf('=')
    if (separatorIndex <= 0 || separatorIndex === entry.length - 1) {
      throw new ValidationError(`Invalid ${optionName} value "${entry}". Expected key=value.`)
    }

    const key = entry.slice(0, separatorIndex).trim()
    const value = entry.slice(separatorIndex + 1).trim()

    if (!key || !value) {
      throw new ValidationError(`Invalid ${optionName} value "${entry}". Expected key=value.`)
    }

    output[key] = value
  }

  return output
}

export function parseJsonObject(raw: string | undefined, optionName: string): Record<string, unknown> {
  if (!raw) {
    throw new ValidationError(`${optionName} is required.`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new ValidationError(`Invalid JSON provided in ${optionName}.`)
  }

  if (!isRecord(parsed)) {
    throw new ValidationError(`${optionName} must be a JSON object.`)
  }

  return parsed
}

export function parseOptionalJsonObject(
  raw: string | undefined,
  optionName: string,
): Record<string, unknown> | undefined {
  if (!raw) {
    return undefined
  }

  return parseJsonObject(raw, optionName)
}

export function extractResource<T extends ResourceRecord>(
  response: ResourceResponse<T>,
): T | ResourceRecord {
  if (isRecord(response.data)) {
    return response.data
  }

  return response
}

export function resourceQuietId(resource: ResourceRecord, fallback?: string): string | undefined {
  if (typeof resource.id === 'string' && resource.id.length > 0) {
    return resource.id
  }

  return fallback
}

export async function listResources<T>(
  client: HttpClient,
  path: string,
  options: {
    limit: number
    query?: Record<string, string>
  },
): Promise<PaginationResult<T>> {
  return paginateWithLinks<T>(
    async (nextUrl) =>
      nextUrl
        ? client.request<ResourceListResponse<T>>('GET', path, {
            absoluteUrl: nextUrl,
          })
        : client.get<ResourceListResponse<T>>(path, {
            query: options.query,
          }),
    { limit: options.limit },
  )
}
