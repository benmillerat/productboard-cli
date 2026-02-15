import { describe, expect, it } from 'vitest'

import { normalizeLimit, paginateWithCursor, paginateWithLinks } from '../../src/core/pagination.js'

describe('core/pagination', () => {
  it('normalizes limits', () => {
    expect(normalizeLimit(undefined)).toBe(100)
    expect(normalizeLimit(0)).toBe(100)
    expect(normalizeLimit(-3)).toBe(100)
    expect(normalizeLimit(12.9)).toBe(12)
    expect(normalizeLimit(2_000)).toBe(1000)
  })

  it('paginates link-based payloads', async () => {
    const pages = new Map<string, { data: Array<{ id: string }>; links?: { next?: string } }>([
      ['first', { data: [{ id: '1' }, { id: '2' }], links: { next: 'second' } }],
      ['second', { data: [{ id: '3' }] }],
    ])

    let current = 'first'
    const result = await paginateWithLinks(
      async (nextUrl) => {
        const key = nextUrl ?? current
        const payload = pages.get(key)
        if (!payload) {
          return { data: [] }
        }

        if (!nextUrl) {
          current = 'second'
        }

        return payload
      },
      { limit: 3 },
    )

    expect(result.count).toBe(3)
    expect(result.items.map((item) => item.id)).toEqual(['1', '2', '3'])
    expect(result.hasMore).toBe(false)
  })

  it('paginates cursor-based payloads', async () => {
    const result = await paginateWithCursor<{ id: string }>(
      async (cursor) => {
        if (!cursor) {
          return { data: [{ id: 'a' }, { id: 'b' }], pageCursor: 'cursor-2' }
        }

        if (cursor === 'cursor-2') {
          return { data: [{ id: 'c' }] }
        }

        return { data: [] }
      },
      { limit: 3 },
    )

    expect(result.items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })
})
