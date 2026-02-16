import { formatDate, nullPlaceholder, resolveDotPath, stripHtml, type Presenter } from '../presenter.js'

function pickOwner(item: Record<string, unknown>): string {
  const ownerName = resolveDotPath(item, 'owner.name')
  if (typeof ownerName === 'string' && ownerName.trim().length > 0) {
    return ownerName
  }

  const ownerEmail = resolveDotPath(item, 'owner.email')
  if (typeof ownerEmail === 'string' && ownerEmail.trim().length > 0) {
    return ownerEmail
  }

  return nullPlaceholder
}

function createdBy(item: Record<string, unknown>): string {
  const name = resolveDotPath(item, 'createdBy.name')
  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  const email = resolveDotPath(item, 'createdBy.email')
  if (typeof email === 'string' && email.trim().length > 0) {
    return email
  }

  return nullPlaceholder
}

function featureCount(item: Record<string, unknown>): string {
  const features = resolveDotPath(item, 'features')
  if (!Array.isArray(features) || features.length === 0) {
    return nullPlaceholder
  }

  return String(features.length)
}

function tagsValue(item: Record<string, unknown>): string {
  const tags = resolveDotPath(item, 'tags')
  if (!Array.isArray(tags) || tags.length === 0) {
    return nullPlaceholder
  }

  const values = tags
    .map((tag) => {
      if (typeof tag === 'string') {
        const cleaned = stripHtml(tag)
        return cleaned.length > 0 ? cleaned : undefined
      }

      if (typeof tag === 'object' && tag !== null) {
        const record = tag as Record<string, unknown>
        const name = record.name
        if (typeof name === 'string') {
          const cleaned = stripHtml(name)
          return cleaned.length > 0 ? cleaned : undefined
        }
      }

      return undefined
    })
    .filter((tag): tag is string => typeof tag === 'string')

  return values.length > 0 ? values.join(', ') : nullPlaceholder
}

function companyId(item: Record<string, unknown>): string {
  const company = resolveDotPath(item, 'company.id')
  if (typeof company === 'string' && company.trim().length > 0) {
    return company
  }

  return nullPlaceholder
}

function displayUrl(item: Record<string, unknown>): string {
  const url = resolveDotPath(item, 'displayUrl')
  if (typeof url === 'string' && url.trim().length > 0) {
    return url
  }

  return nullPlaceholder
}

export const notesPresenter: Presenter = {
  resource: 'notes',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'TITLE', accessor: 'title', maxWidth: 60 },
    { header: 'STATE', accessor: 'state' },
    { header: 'OWNER', accessor: pickOwner },
    { header: 'FEATURES', accessor: featureCount },
    { header: 'TAGS', accessor: tagsValue, maxWidth: 40 },
    { header: 'UPDATED', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { header: 'COMPANY', accessor: companyId, wide: true },
    { header: 'CREATED_BY', accessor: createdBy, wide: true },
    { header: 'URL', accessor: displayUrl, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'title', accessor: 'title' },
    { label: 'state', accessor: 'state' },
    { label: 'owner', accessor: pickOwner },
    { label: 'features', accessor: featureCount },
    { label: 'tags', accessor: tagsValue },
    { label: 'company', accessor: companyId },
    { label: 'created_by', accessor: createdBy },
    { label: 'created', accessor: (item) => formatDate(resolveDotPath(item, 'createdAt')) },
    { label: 'updated', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { label: 'url', accessor: displayUrl },
  ],
}
