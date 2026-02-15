export const DEFAULT_LIMIT = 100
export const MAX_PAGE_SIZE = 100

export interface PaginationResult<T> {
  items: T[]
  count: number
  hasMore: boolean
  next: string | null
}

export function normalizeLimit(inputLimit: number | undefined, fallback = DEFAULT_LIMIT): number {
  const value = Number(inputLimit ?? fallback)
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return Math.min(Math.floor(value), 1000)
}

export interface LinksPage<T> {
  data?: T[]
  links?: {
    next?: string
  }
}

export async function paginateWithLinks<T>(
  fetchPage: (nextUrl: string | null) => Promise<LinksPage<T>>,
  options?: { limit?: number },
): Promise<PaginationResult<T>> {
  const maxItems = normalizeLimit(options?.limit)
  const items: T[] = []
  let nextUrl: string | null = null

  while (items.length < maxItems) {
    const payload = await fetchPage(nextUrl)
    const pageItems = Array.isArray(payload.data) ? payload.data : []

    const remaining = maxItems - items.length
    items.push(...pageItems.slice(0, remaining))

    const candidateNext = payload.links?.next
    if (!candidateNext || items.length >= maxItems) {
      return {
        items,
        count: items.length,
        hasMore: Boolean(candidateNext) && items.length >= maxItems,
        next: candidateNext ?? null,
      }
    }

    nextUrl = candidateNext
  }

  return {
    items,
    count: items.length,
    hasMore: false,
    next: null,
  }
}

export interface CursorPage<T> {
  data?: T[]
  pageCursor?: string
}

export interface CursorPaginationResult<T> {
  items: T[]
  count: number
  hasMore: boolean
  nextCursor: string | null
}

export async function paginateWithCursor<T>(
  fetchPage: (cursor: string | null, pageLimit: number) => Promise<CursorPage<T>>,
  options?: { limit?: number; initialCursor?: string | null },
): Promise<CursorPaginationResult<T>> {
  const maxItems = normalizeLimit(options?.limit)
  const items: T[] = []
  let cursor = options?.initialCursor ?? null

  while (items.length < maxItems) {
    const remaining = maxItems - items.length
    const pageLimit = Math.min(MAX_PAGE_SIZE, remaining)

    const payload = await fetchPage(cursor, pageLimit)
    const pageItems = Array.isArray(payload.data) ? payload.data : []

    items.push(...pageItems.slice(0, remaining))

    cursor = payload.pageCursor ?? null
    if (!cursor || items.length >= maxItems) {
      return {
        items,
        count: items.length,
        hasMore: Boolean(cursor) && items.length >= maxItems,
        nextCursor: cursor,
      }
    }
  }

  return {
    items,
    count: items.length,
    hasMore: false,
    nextCursor: null,
  }
}
