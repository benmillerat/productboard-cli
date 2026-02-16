import { formatBoolean, nullPlaceholder, resolveDotPath, stripHtml, type Presenter } from '../presenter.js'

function linksSelf(item: Record<string, unknown>): string {
  const url = resolveDotPath(item, 'links.self')
  return typeof url === 'string' && url.trim().length > 0 ? url : nullPlaceholder
}

function description(item: Record<string, unknown>): string {
  const cleaned = stripHtml(resolveDotPath(item, 'description'))
  return cleaned.length > 0 ? cleaned : nullPlaceholder
}

export const releaseGroupsPresenter: Presenter = {
  resource: 'release-groups',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 60 },
    { header: 'ARCHIVED', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')) },
    { header: 'DESCRIPTION', accessor: description, maxWidth: 60, wide: true },
    { header: 'URL', accessor: linksSelf, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'description', accessor: description },
    { label: 'archived', accessor: (item) => formatBoolean(resolveDotPath(item, 'archived')) },
    { label: 'url', accessor: linksSelf },
  ],
}
