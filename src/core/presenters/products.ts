import { formatDate, nullPlaceholder, resolveDotPath, stripHtml, type Presenter } from '../presenter.js'

function ownerEmail(item: Record<string, unknown>): string {
  const owner = resolveDotPath(item, 'owner.email')
  return typeof owner === 'string' && owner.trim().length > 0 ? owner : nullPlaceholder
}

function linksSelf(item: Record<string, unknown>): string {
  const url = resolveDotPath(item, 'links.self')
  return typeof url === 'string' && url.trim().length > 0 ? url : nullPlaceholder
}

function description(item: Record<string, unknown>): string {
  const cleaned = stripHtml(resolveDotPath(item, 'description'))
  return cleaned.length > 0 ? cleaned : nullPlaceholder
}

export const productsPresenter: Presenter = {
  resource: 'products',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 60 },
    { header: 'OWNER', accessor: ownerEmail },
    { header: 'UPDATED', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { header: 'DESCRIPTION', accessor: description, maxWidth: 60, wide: true },
    { header: 'URL', accessor: linksSelf, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'description', accessor: description },
    { label: 'owner', accessor: ownerEmail },
    { label: 'created', accessor: (item) => formatDate(resolveDotPath(item, 'createdAt')) },
    { label: 'updated', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { label: 'url', accessor: linksSelf },
  ],
}
