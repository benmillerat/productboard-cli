import { formatDate, nullPlaceholder, resolveDotPath, stripHtml, type Presenter } from '../presenter.js'

function ownerEmail(item: Record<string, unknown>): string {
  const owner = resolveDotPath(item, 'owner.email')
  return typeof owner === 'string' && owner.trim().length > 0 ? owner : nullPlaceholder
}

function productId(item: Record<string, unknown>): string {
  const product = resolveDotPath(item, 'parent.product.id')
  return typeof product === 'string' && product.trim().length > 0 ? product : nullPlaceholder
}

function linksHtml(item: Record<string, unknown>): string {
  const link = resolveDotPath(item, 'links.html')
  return typeof link === 'string' && link.trim().length > 0 ? link : nullPlaceholder
}

function description(item: Record<string, unknown>): string {
  const rawDescription = resolveDotPath(item, 'description')
  const cleaned = stripHtml(rawDescription)
  return cleaned.length > 0 ? cleaned : nullPlaceholder
}

export const componentsPresenter: Presenter = {
  resource: 'components',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 48 },
    { header: 'OWNER', accessor: ownerEmail },
    { header: 'UPDATED', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { header: 'PRODUCT', accessor: productId, wide: true },
    { header: 'URL', accessor: linksHtml, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'owner', accessor: ownerEmail },
    { label: 'product', accessor: productId },
    { label: 'description', accessor: description },
    { label: 'created', accessor: (item) => formatDate(resolveDotPath(item, 'createdAt')) },
    { label: 'updated', accessor: (item) => formatDate(resolveDotPath(item, 'updatedAt')) },
    { label: 'url', accessor: linksHtml },
  ],
}
