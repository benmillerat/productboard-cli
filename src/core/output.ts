import { Flags } from '@oclif/core'
import { stringify as yamlStringify } from 'yaml'

import { createGenericPresenter } from './presenters/generic.js'
import {
  formatDisplayValue,
  nullPlaceholder,
  projectDetailFields,
  projectListRows,
  resolveDotPath,
  truncate,
  type Presenter,
} from './presenter.js'

export const OUTPUT_FORMATS = ['table', 'plain', 'json', 'yaml', 'ndjson'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

export interface RenderOptions {
  presenter?: Presenter
  wide?: boolean
  resultsOnly?: boolean
  resource?: string
}

export interface OutputOptions<TData = unknown> extends RenderOptions {
  format: OutputFormat
  quiet: boolean
  quietValue?: string | string[] | ((data: TData) => string | string[] | undefined)
}

export const outputFlags = {
  output: Flags.string({
    options: [...OUTPUT_FORMATS],
    description: 'Output format',
  }),
  plain: Flags.boolean({
    description: 'Shorthand for --output plain',
    default: false,
  }),
  'results-only': Flags.boolean({
    description: 'For --output json, print only the primary data payload',
    default: false,
  }),
  wide: Flags.boolean({
    description: 'Include additional wide columns in table/plain modes',
    default: false,
  }),
  quiet: Flags.boolean({
    description: 'Suppress standard output and print compact identifiers only',
    default: false,
  }),
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeCell(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function padCell(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }

  return `${value}${' '.repeat(width - value.length)}`
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

  // For list envelopes ({data: [...], count, hasMore, next}), emit one item per line
  if (isPlainObject(data) && Array.isArray(data.data)) {
    return (data.data as unknown[]).map((item) => JSON.stringify(item)).join('\n')
  }

  return JSON.stringify(data)
}

function renderAlignedTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return 'No results.'
  }

  const widths = headers.map((header, index) => {
    const maxRowWidth = rows.reduce((maxWidth, row) => {
      const cell = row[index] ?? ''
      return Math.max(maxWidth, cell.length)
    }, 0)

    return Math.max(header.length, maxRowWidth)
  })

  const headerLine = headers.map((header, index) => padCell(header, widths[index] ?? 0)).join('  ')
  const bodyLines = rows.map((row) =>
    headers
      .map((_, index) => {
        const cell = row[index] ?? nullPlaceholder
        return padCell(cell, widths[index] ?? 0)
      })
      .join('  '),
  )

  return [headerLine, ...bodyLines].join('\n')
}

function renderTsv(headers: string[], rows: string[][]): string {
  if (headers.length === 0) {
    return ''
  }

  const lines = [headers.join('\t')]
  for (const row of rows) {
    lines.push(row.map((cell) => normalizeCell(cell)).join('\t'))
  }

  return lines.join('\n')
}

function renderDetailTable(fields: Array<{ label: string; value: string }>): string {
  if (fields.length === 0) {
    return 'No results.'
  }

  const labelWidth = fields.reduce((max, field) => Math.max(max, field.label.length), 0)
  return fields.map((field) => `${padCell(field.label, labelWidth)}\t${field.value}`).join('\n')
}

function renderDetailPlain(fields: Array<{ label: string; value: string }>): string {
  if (fields.length === 0) {
    return ''
  }

  return fields.map((field) => `${field.label}\t${normalizeCell(field.value)}`).join('\n')
}

function extractPrimaryData(data: unknown, primaryPath: string | undefined): unknown {
  if (!primaryPath) {
    return data
  }

  const extracted = resolveDotPath(data, primaryPath)
  return extracted === undefined ? data : extracted
}

function maybeExtractDataArray(data: unknown): unknown[] | undefined {
  if (Array.isArray(data)) {
    return data as unknown[]
  }

  const extracted = resolveDotPath(data, 'data')
  return Array.isArray(extracted) ? (extracted as unknown[]) : undefined
}

function maybeExtractDetailRecord(data: unknown): Record<string, unknown> | undefined {
  if (isPlainObject(data)) {
    return data
  }

  const extracted = resolveDotPath(data, 'data')
  return isPlainObject(extracted) ? extracted : undefined
}

function hasMoreResults(data: unknown): boolean {
  if (!isPlainObject(data)) {
    return false
  }

  const listItems = maybeExtractDataArray(data)
  if (!listItems) {
    return false
  }

  const hasMore = data.hasMore === true
  const next = data.next
  const hasNextCursor = next !== null && next !== undefined

  return hasMore || hasNextCursor
}

function emitPaginationHint(data: unknown): void {
  if (!hasMoreResults(data)) {
    return
  }

  process.stderr.write('# More results available. Use --cursor <token> or --all to fetch more.\n')
}

function serializeHumanOutput(
  data: unknown,
  format: 'table' | 'plain',
  options?: RenderOptions,
): string {
  const wide = options?.wide ?? false
  const listItems = Array.isArray(data) ? data : maybeExtractDataArray(data)

  if (listItems) {
    const sample = listItems.find((item) => isPlainObject(item)) ?? listItems[0] ?? {}
    const presenter =
      options?.presenter ?? createGenericPresenter(options?.resource ?? 'resource', sample)
    const columns = presenter.listColumns.filter((column) => !column.wide || wide)
    const headers = columns.map((column) => column.header)

    const rows = projectListRows(listItems, presenter, wide).map((row) =>
      columns.map((column) => {
        const value = row[column.header] ?? nullPlaceholder
        const normalized = normalizeCell(value)

        if (format === 'table' && typeof column.maxWidth === 'number' && column.maxWidth > 0) {
          return truncate(normalized, column.maxWidth)
        }

        return normalized
      }),
    )

    return format === 'plain' ? renderTsv(headers, rows) : renderAlignedTable(headers, rows)
  }

  const detailRecord = maybeExtractDetailRecord(data)
  if (detailRecord) {
    const presenter =
      options?.presenter ?? createGenericPresenter(options?.resource ?? 'resource', detailRecord)
    const fields = projectDetailFields(detailRecord, presenter, wide)

    return format === 'plain' ? renderDetailPlain(fields) : renderDetailTable(fields)
  }

  return formatDisplayValue(data)
}

export function serializeOutput(
  data: unknown,
  format: OutputFormat,
  options?: RenderOptions,
): string {
  switch (format) {
    case 'json': {
      const output =
        options?.resultsOnly === true
          ? extractPrimaryData(data, options.presenter?.primaryPath ?? 'data')
          : data

      return JSON.stringify(output, null, 2)
    }

    case 'yaml':
      return yamlStringify(data)
    case 'ndjson':
      return serializeNdjson(data)
    case 'table':
      return serializeHumanOutput(data, 'table', options)
    case 'plain':
      return serializeHumanOutput(data, 'plain', options)
    default: {
      const exhaustiveCheck: never = format
      throw new Error(`Unsupported output format: ${String(exhaustiveCheck)}`)
    }
  }
}

/**
 * Write formatted output to stdout.
 *
 * The first parameter (`_log`) is accepted for API compatibility but ignored.
 * Output is written via `process.stdout.write` to avoid oclif `this`-binding
 * issues when `this.log` is passed as an unbound callback.
 */
export function outputResult<TData>(
  _log: (message: string) => void,
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
      process.stdout.write(values.join('\n') + '\n')
    }

    return
  }

  if (options.format === 'table' || options.format === 'plain') {
    emitPaginationHint(data)
  }

  process.stdout.write(
    serializeOutput(data, options.format, {
      presenter: options.presenter,
      wide: options.wide,
      resultsOnly: options.resultsOnly,
      resource: options.resource,
    }) + '\n',
  )
}
