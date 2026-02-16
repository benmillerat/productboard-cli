import { formatDate, nullPlaceholder, resolveDotPath, type Presenter } from '../presenter.js'

function ownerEmail(item: Record<string, unknown>): string {
  const owner = resolveDotPath(item, 'owner.email')
  return typeof owner === 'string' && owner.trim().length > 0 ? owner : nullPlaceholder
}

function linksHtml(item: Record<string, unknown>): string {
  const link = resolveDotPath(item, 'links.html')
  return typeof link === 'string' && link.trim().length > 0 ? link : nullPlaceholder
}

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

export const initiativesPresenter: Presenter = {
  resource: 'initiatives',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 60 },
    { header: 'OWNER', accessor: ownerEmail },
    { header: 'UPDATED', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { header: 'TIMEFRAME', accessor: timeframe, wide: true },
    { header: 'URL', accessor: linksHtml, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'owner', accessor: ownerEmail },
    { label: 'timeframe', accessor: timeframe },
    { label: 'created', accessor: (item) => formatDate(resolveDotPath(item, 'createdAt')) },
    { label: 'updated', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { label: 'url', accessor: linksHtml },
  ],
}
