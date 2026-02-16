import {
  formatBoolean,
  formatDate,
  nullPlaceholder,
  resolveDotPath,
  stripHtml,
  type Presenter,
} from '../presenter.js'

function toTimeframeDate(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed === 'none') {
    return undefined
  }

  return trimmed
}

function timeframe(item: Record<string, unknown>): string {
  const start =
    toTimeframeDate(resolveDotPath(item, 'timeframe.startDate')) ??
    toTimeframeDate(resolveDotPath(item, 'timeframe.start'))
  const end =
    toTimeframeDate(resolveDotPath(item, 'timeframe.endDate')) ??
    toTimeframeDate(resolveDotPath(item, 'timeframe.end'))

  if (!start && !end) {
    return nullPlaceholder
  }

  if (start && end) {
    return `${start} → ${end}`
  }

  return start ?? end ?? nullPlaceholder
}

function ownerEmail(item: Record<string, unknown>): string {
  const owner = resolveDotPath(item, 'owner.email')
  return typeof owner === 'string' && owner.trim().length > 0 ? owner : nullPlaceholder
}

function statusName(item: Record<string, unknown>): string {
  const status = resolveDotPath(item, 'status.name')
  return typeof status === 'string' && status.trim().length > 0 ? status : nullPlaceholder
}

function statusId(item: Record<string, unknown>): string {
  const status = resolveDotPath(item, 'status.id')
  return typeof status === 'string' && status.trim().length > 0 ? status : nullPlaceholder
}

function levelValue(item: Record<string, unknown>): string {
  const levelName = resolveDotPath(item, 'level.name')
  if (typeof levelName === 'string' && levelName.trim().length > 0) {
    return levelName
  }

  const levelId = resolveDotPath(item, 'level.id')
  if (typeof levelId === 'string' && levelId.trim().length > 0) {
    return levelId
  }

  const level = resolveDotPath(item, 'level')
  if (typeof level === 'string' && level.trim().length > 0) {
    return level
  }

  return nullPlaceholder
}

function parentValue(item: Record<string, unknown>): string {
  const parentId = resolveDotPath(item, 'parent.id')
  if (typeof parentId === 'string' && parentId.trim().length > 0) {
    return parentId
  }

  const parent = resolveDotPath(item, 'parent')
  if (typeof parent === 'string' && parent.trim().length > 0) {
    return parent
  }

  return nullPlaceholder
}

function linksSelf(item: Record<string, unknown>): string {
  const url = resolveDotPath(item, 'links.self')
  return typeof url === 'string' && url.trim().length > 0 ? url : nullPlaceholder
}

function description(item: Record<string, unknown>): string {
  const cleaned = stripHtml(resolveDotPath(item, 'description'))
  return cleaned.length > 0 ? cleaned : nullPlaceholder
}

export const objectivesPresenter: Presenter = {
  resource: 'objectives',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 60 },
    { header: 'STATUS', accessor: statusName },
    { header: 'OWNER', accessor: ownerEmail },
    { header: 'UPDATED', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { header: 'TIMEFRAME', accessor: timeframe, wide: true },
    { header: 'ARCHIVED', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')), wide: true },
    { header: 'LEVEL', accessor: levelValue, wide: true },
    { header: 'URL', accessor: linksSelf, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'description', accessor: description },
    { label: 'level', accessor: levelValue },
    { label: 'parent', accessor: parentValue },
    { label: 'owner', accessor: ownerEmail },
    { label: 'status', accessor: statusName },
    { label: 'status_id', accessor: statusId },
    { label: 'state', accessor: 'state' },
    { label: 'timeframe', accessor: timeframe },
    { label: 'timeframe_start', accessor: 'timeframe.startDate' },
    { label: 'timeframe_end', accessor: 'timeframe.endDate' },
    { label: 'timeframe_granularity', accessor: 'timeframe.granularity' },
    { label: 'archived', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')) },
    { label: 'created', accessor: (item) => formatDate(resolveDotPath(item, 'createdAt')) },
    { label: 'updated', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { label: 'url', accessor: linksSelf },
  ],
}
