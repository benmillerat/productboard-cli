import { nullPlaceholder, resolveDotPath, stripHtml, type Presenter } from '../presenter.js'

function sourceOrigin(item: Record<string, unknown>): string {
  const source = resolveDotPath(item, 'sourceOrigin')
  return typeof source === 'string' && source.trim().length > 0 ? source : nullPlaceholder
}

function sourceRecordId(item: Record<string, unknown>): string {
  const sourceRecord = resolveDotPath(item, 'sourceRecordId')
  return typeof sourceRecord === 'string' && sourceRecord.trim().length > 0
    ? sourceRecord
    : nullPlaceholder
}

function description(item: Record<string, unknown>): string {
  const rawDescription = resolveDotPath(item, 'description')
  const cleaned = stripHtml(rawDescription)
  return cleaned.length > 0 ? cleaned : nullPlaceholder
}

export const companiesPresenter: Presenter = {
  resource: 'companies',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 48 },
    { header: 'DOMAIN', accessor: 'domain' },
    { header: 'SOURCE', accessor: sourceOrigin },
    { header: 'SOURCE_RECORD', accessor: sourceRecordId, wide: true },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
    { label: 'domain', accessor: 'domain' },
    { label: 'sourceOrigin', accessor: sourceOrigin },
    { label: 'sourceRecordId', accessor: sourceRecordId },
    { label: 'description', accessor: description },
  ],
}
