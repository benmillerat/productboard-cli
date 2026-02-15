import { Flags } from '@oclif/core'
import Table from 'cli-table3'
import { stringify as yamlStringify } from 'yaml'

export const OUTPUT_FORMATS = ['table', 'json', 'yaml', 'ndjson'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

export interface OutputOptions<TData = unknown> {
  format: OutputFormat
  quiet: boolean
  quietValue?: string | string[] | ((data: TData) => string | string[] | undefined)
}

export const outputFlags = {
  output: Flags.string({
    options: [...OUTPUT_FORMATS],
    description: 'Output format',
    default: 'table',
  }),
  quiet: Flags.boolean({
    description: 'Suppress standard output and print compact identifiers only',
    default: false,
  }),
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function scalarToString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

function inferQuietValue(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (isPlainObject(item) && typeof item.id === 'string') {
          return item.id
        }

        if (typeof item === 'string' || typeof item === 'number') {
          return String(item)
        }

        return undefined
      })
      .filter((value): value is string => typeof value === 'string')
  }

  if (isPlainObject(data) && typeof data.id === 'string') {
    return [data.id]
  }

  if (typeof data === 'string' || typeof data === 'number') {
    return [String(data)]
  }

  return []
}

function serializeNdjson(data: unknown): string {
  if (Array.isArray(data)) {
    return data.map((item) => JSON.stringify(item)).join('\n')
  }

  return JSON.stringify(data)
}

function renderTable(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return 'No results.'
    }

    const firstObject = data.find((item) => isPlainObject(item))
    if (!firstObject) {
      const table = new Table({ head: ['value'] })
      for (const entry of data) {
        table.push([scalarToString(entry)])
      }

      return table.toString()
    }

    const headers = Object.keys(firstObject)
    const table = new Table({ head: headers })

    for (const row of data) {
      if (!isPlainObject(row)) {
        table.push([scalarToString(row)])
        continue
      }

      table.push(headers.map((header) => scalarToString(row[header])))
    }

    return table.toString()
  }

  if (isPlainObject(data)) {
    const table = new Table({ head: ['field', 'value'] })

    for (const [key, value] of Object.entries(data)) {
      table.push([key, scalarToString(value)])
    }

    return table.toString()
  }

  return scalarToString(data)
}

export function serializeOutput(data: unknown, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2)
    case 'yaml':
      return yamlStringify(data)
    case 'ndjson':
      return serializeNdjson(data)
    case 'table':
      return renderTable(data)
    default: {
      const exhaustiveCheck: never = format
      throw new Error(`Unsupported output format: ${String(exhaustiveCheck)}`)
    }
  }
}

export function outputResult<TData>(
  log: (message: string) => void,
  data: TData,
  options: OutputOptions<TData>,
): void {
  if (options.quiet) {
    const quietValue =
      typeof options.quietValue === 'function' ? options.quietValue(data) : options.quietValue
    const values = quietValue
      ? Array.isArray(quietValue)
        ? quietValue
        : [quietValue]
      : inferQuietValue(data)

    if (values.length > 0) {
      log(values.join('\n'))
    }

    return
  }

  log(serializeOutput(data, options.format))
}
