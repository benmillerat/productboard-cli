import {
  formatBoolean,
  formatDate,
  nullPlaceholder,
  resolveDotPath,
  type Presenter,
} from '../presenter.js'

function firstParentId(item: Record<string, unknown>): string {
  const featureParent = resolveDotPath(item, 'parent.feature.id')
  if (typeof featureParent === 'string' && featureParent.trim().length > 0) {
    return featureParent
  }

  const componentParent = resolveDotPath(item, 'parent.component.id')
  if (typeof componentParent === 'string' && componentParent.trim().length > 0) {
    return componentParent
  }

  return nullPlaceholder
}

function timeframeValue(item: Record<string, unknown>): string {
  const startRaw = resolveDotPath(item, 'timeframe.startDate')
  const endRaw = resolveDotPath(item, 'timeframe.endDate')

  const start =
    typeof startRaw === 'string' && startRaw.trim().length > 0 && startRaw !== 'none'
      ? startRaw
      : undefined
  const end =
    typeof endRaw === 'string' && endRaw.trim().length > 0 && endRaw !== 'none' ? endRaw : undefined

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

function linksHtml(item: Record<string, unknown>): string {
  const link = resolveDotPath(item, 'links.html')
  return typeof link === 'string' && link.trim().length > 0 ? link : nullPlaceholder
}

export const featuresPresenter: Presenter = {
  resource: 'features',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 60 },
    { header: 'TYPE', accessor: 'type' },
    { header: 'STATUS', accessor: statusName },
    { header: 'OWNER', accessor: ownerEmail },
    { header: 'UPDATED', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { header: 'PARENT', accessor: firstParentId, wide: true },
    { header: 'TIMEFRAME', accessor: timeframeValue, wide: true },
    { header: 'ARCHIVED', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')), wide: true },
    { header: 'URL', accessor: linksHtml, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'type', accessor: 'type' },
    { label: 'status', accessor: statusName },
    { label: 'owner', accessor: ownerEmail },
    { label: 'parent', accessor: firstParentId },
    { label: 'timeframe', accessor: timeframeValue },
    { label: 'archived', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')) },
    { label: 'created', accessor: (item) => formatDate(resolveDotPath(item, 'createdAt')) },
    { label: 'updated', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { label: 'url', accessor: linksHtml },
  ],
}
