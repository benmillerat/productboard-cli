import { nullPlaceholder, type ColumnSpec, type DetailField, type Presenter } from '../presenter.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toGenericValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return nullPlaceholder
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function keyToHeader(key: string): string {
  return key.toUpperCase()
}

function buildColumns(keys: string[]): ColumnSpec[] {
  if (keys.length === 0) {
    return [{ header: 'VALUE', accessor: (item) => toGenericValue(item.value) }]
  }

  return keys.map((key) => ({
    header: keyToHeader(key),
    accessor: (item: Record<string, unknown>) => toGenericValue(item[key]),
  }))
}

function buildFields(keys: string[]): DetailField[] {
  if (keys.length === 0) {
    return [{ label: 'value', accessor: (item) => toGenericValue(item.value) }]
  }

  return keys.map((key) => ({
    label: key,
    accessor: (item: Record<string, unknown>) => toGenericValue(item[key]),
  }))
}

function sampleToKeys(sample: unknown): string[] {
  if (isRecord(sample)) {
    return Object.keys(sample)
  }

  return []
}

export function createGenericPresenter(resource: string, sample: unknown): Presenter {
  const keys = sampleToKeys(sample)

  return {
    resource,
    primaryPath: 'data',
    listColumns: buildColumns(keys),
    detailFields: buildFields(keys),
  }
}
