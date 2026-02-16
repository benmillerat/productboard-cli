import {
  formatBoolean,
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

function releaseGroupId(item: Record<string, unknown>): string {
  const releaseGroup = resolveDotPath(item, 'releaseGroup.id')
  return typeof releaseGroup === 'string' && releaseGroup.trim().length > 0
    ? releaseGroup
    : nullPlaceholder
}

function releaseGroupUrl(item: Record<string, unknown>): string {
  const url = resolveDotPath(item, 'releaseGroup.links.self')
  return typeof url === 'string' && url.trim().length > 0 ? url : nullPlaceholder
}

function linksSelf(item: Record<string, unknown>): string {
  const url = resolveDotPath(item, 'links.self')
  return typeof url === 'string' && url.trim().length > 0 ? url : nullPlaceholder
}

function description(item: Record<string, unknown>): string {
  const cleaned = stripHtml(resolveDotPath(item, 'description'))
  return cleaned.length > 0 ? cleaned : nullPlaceholder
}

export const releasesPresenter: Presenter = {
  resource: 'releases',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 60 },
    { header: 'STATE', accessor: 'state' },
    { header: 'TIMEFRAME', accessor: timeframe },
    { header: 'ARCHIVED', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')) },
    { header: 'RELEASE_GROUP', accessor: releaseGroupId, wide: true },
    { header: 'DESCRIPTION', accessor: description, maxWidth: 60, wide: true },
    { header: 'URL', accessor: linksSelf, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'state', accessor: 'state' },
    { label: 'timeframe', accessor: timeframe },
    { label: 'timeframe_start', accessor: 'timeframe.startDate' },
    { label: 'timeframe_end', accessor: 'timeframe.endDate' },
    { label: 'timeframe_granularity', accessor: 'timeframe.granularity' },
    { label: 'release_group', accessor: releaseGroupId },
    { label: 'release_group_url', accessor: releaseGroupUrl },
    { label: 'description', accessor: description },
    { label: 'archived', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')) },
    { label: 'url', accessor: linksSelf },
  ],
}
