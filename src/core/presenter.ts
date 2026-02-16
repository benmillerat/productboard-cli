export type AccessorResolver = string | ((item: Record<string, unknown>) => unknown)

export interface ColumnSpec {
  header: string
  accessor: AccessorResolver
  maxWidth?: number
  wide?: boolean
}

export interface DetailField {
  label: string
  accessor: AccessorResolver
  wide?: boolean
}

export interface Presenter {
  resource: string
  listColumns: ColumnSpec[]
  detailFields: DetailField[]
  primaryPath?: string
}

export interface ProjectedDetailField {
  label: string
  value: string
}

export const nullPlaceholder = '-'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveAccessor(item: Record<string, unknown>, accessor: AccessorResolver): unknown {
  if (typeof accessor === 'function') {
    return accessor(item)
  }

  return resolveDotPath(item, accessor)
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function resolveDotPath(obj: unknown, path: string): unknown {
  if (!path) {
    return undefined
  }

  const segments = path.split('.').filter((segment) => segment.length > 0)
  let current: unknown = obj

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index) || index < 0) {
        return undefined
      }

      current = current[index]
      continue
    }

    if (!isRecord(current)) {
      return undefined
    }

    current = current[segment]
  }

  return current
}

export function formatDate(iso: unknown): string {
  if (typeof iso !== 'string' || iso.trim().length === 0) {
    return nullPlaceholder
  }

  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return nullPlaceholder
  }

  const year = parsed.getFullYear()
  const month = pad(parsed.getMonth() + 1)
  const day = pad(parsed.getDate())
  const hours = pad(parsed.getHours())
  const minutes = pad(parsed.getMinutes())

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function truncate(value: string, max: number): string {
  if (max <= 0 || value.length <= max) {
    return value
  }

  if (max === 1) {
    return '…'
  }

  return `${value.slice(0, max - 1)}…`
}

export function stripHtml(html: unknown): string {
  if (typeof html !== 'string') {
    return ''
  }

  const withoutTags = html.replace(/<[^>]*>/g, ' ')

  const decoded = withoutTags
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')

  return decoded.replace(/\s+/g, ' ').trim()
}

export function formatBoolean(value: unknown): string {
  if (value === true) {
    return 'true'
  }

  if (value === false) {
    return 'false'
  }

  return nullPlaceholder
}

export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return nullPlaceholder
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : nullPlaceholder
  }

  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    const serialized = JSON.stringify(value)
    return typeof serialized === 'string' ? serialized : nullPlaceholder
  } catch {
    return String(value)
  }
}

function isListColumnVisible(column: ColumnSpec, wide: boolean): boolean {
  return !column.wide || wide
}

function isDetailFieldVisible(field: DetailField, wide: boolean): boolean {
  return !field.wide || wide
}

export function projectListRows(
  items: unknown[],
  presenter: Presenter,
  wide: boolean,
): Array<Record<string, string>> {
  const columns = presenter.listColumns.filter((column) => isListColumnVisible(column, wide))

  return items.map((item) => {
    const source = isRecord(item) ? item : { value: item }
    const row: Record<string, string> = {}

    for (const column of columns) {
      row[column.header] = formatDisplayValue(resolveAccessor(source, column.accessor))
    }

    return row
  })
}

export function projectDetailFields(
  item: unknown,
  presenter: Presenter,
  wide: boolean,
): ProjectedDetailField[] {
  const source = isRecord(item) ? item : { value: item }

  return presenter.detailFields
    .filter((field) => isDetailFieldVisible(field, wide))
    .map((field) => ({
      label: field.label,
      value: formatDisplayValue(resolveAccessor(source, field.accessor)),
    }))
}
