import { describe, expect, it } from 'vitest'

import {
  formatBoolean,
  formatDate,
  nullPlaceholder,
  projectDetailFields,
  projectListRows,
  resolveDotPath,
  stripHtml,
  truncate,
  type Presenter,
} from '../../src/core/presenter.js'

describe('core/presenter', () => {
  it('resolves nested dot paths safely', () => {
    const payload = {
      owner: {
        profile: {
          email: 'owner@example.com',
        },
      },
      items: [{ id: 'first' }],
    }

    expect(resolveDotPath(payload, 'owner.profile.email')).toBe('owner@example.com')
    expect(resolveDotPath(payload, 'items.0.id')).toBe('first')
    expect(resolveDotPath(payload, 'items.9.id')).toBeUndefined()
    expect(resolveDotPath(payload, 'missing.path')).toBeUndefined()
  })

  it('formats dates as YYYY-MM-DD HH:mm', () => {
    expect(formatDate('2026-02-16T12:34:56.000Z')).toMatch(/^2026-02-16 \d{2}:\d{2}$/)
    expect(formatDate('')).toBe(nullPlaceholder)
    expect(formatDate('not-a-date')).toBe(nullPlaceholder)
  })

  it('truncates with an ellipsis', () => {
    expect(truncate('Productboard', 7)).toBe('Produc…')
    expect(truncate('Short', 10)).toBe('Short')
  })

  it('strips html and decodes common entities', () => {
    const html = '<p>Hello&nbsp;&lt;world&gt; &amp; team</p>'
    expect(stripHtml(html)).toBe('Hello <world> & team')
  })

  it('formats boolean values', () => {
    expect(formatBoolean(true)).toBe('true')
    expect(formatBoolean(false)).toBe('false')
    expect(formatBoolean(undefined)).toBe(nullPlaceholder)
  })

  it('projects list rows from presenter specs', () => {
    const presenter: Presenter = {
      resource: 'test',
      primaryPath: 'data',
      listColumns: [
        { header: 'ID', accessor: 'id' },
        { header: 'OWNER', accessor: 'owner.email' },
        { header: 'WIDE', accessor: 'meta.note', wide: true },
      ],
      detailFields: [],
    }

    const rows = projectListRows(
      [
        {
          id: 'row_1',
          owner: { email: 'owner@example.com' },
          meta: { note: '' },
        },
      ],
      presenter,
      false,
    )

    expect(rows).toEqual([
      {
        ID: 'row_1',
        OWNER: 'owner@example.com',
      },
    ])

    const wideRows = projectListRows(
      [
        {
          id: 'row_1',
          owner: { email: 'owner@example.com' },
          meta: { note: '' },
        },
      ],
      presenter,
      true,
    )

    expect(wideRows[0]).toEqual({
      ID: 'row_1',
      OWNER: 'owner@example.com',
      WIDE: '-',
    })
  })

  it('projects detail fields from presenter specs', () => {
    const presenter: Presenter = {
      resource: 'test',
      listColumns: [],
      detailFields: [
        { label: 'id', accessor: 'id' },
        { label: 'owner', accessor: (item) => item.ownerEmail ?? nullPlaceholder },
        { label: 'hidden', accessor: 'hidden', wide: true },
      ],
      primaryPath: 'data',
    }

    const fields = projectDetailFields({ id: 'abc', ownerEmail: 'owner@example.com' }, presenter, false)

    expect(fields).toEqual([
      { label: 'id', value: 'abc' },
      { label: 'owner', value: 'owner@example.com' },
    ])

    const wideFields = projectDetailFields({ id: 'abc', ownerEmail: 'owner@example.com' }, presenter, true)

    expect(wideFields[2]).toEqual({ label: 'hidden', value: '-' })
  })
})
