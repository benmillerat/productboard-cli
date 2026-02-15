import nock from 'nock'
import { afterEach, describe, expect, it } from 'vitest'

import { HttpClient } from '../../src/core/http.js'
import { paginateWithLinks } from '../../src/core/pagination.js'

interface Feature {
  id: string
  name: string
}

interface FeaturesResponse {
  data?: Feature[]
  links?: {
    next?: string
  }
}

describe('features list integration', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('fetches multiple pages via links.next with Productboard headers', async () => {
    nock.disableNetConnect()

    const api = nock('https://api.productboard.com', {
      reqheaders: {
        authorization: 'Bearer test-token',
        'x-version': '1',
      },
    })
      .get('/features')
      .reply(200, {
        data: [{ id: 'f1', name: 'Feature 1' }],
        links: { next: 'https://api.productboard.com/features?page=2' },
      })
      .get('/features')
      .query({ page: '2' })
      .reply(200, {
        data: [{ id: 'f2', name: 'Feature 2' }],
      })

    const client = new HttpClient({ token: 'test-token' })

    const result = await paginateWithLinks<Feature>(
      async (nextUrl) =>
        nextUrl
          ? client.request<FeaturesResponse>('GET', '/features', { absoluteUrl: nextUrl })
          : client.get<FeaturesResponse>('/features'),
      { limit: 10 },
    )

    expect(result.items).toEqual([
      { id: 'f1', name: 'Feature 1' },
      { id: 'f2', name: 'Feature 2' },
    ])
    expect(result.hasMore).toBe(false)
    expect(api.isDone()).toBe(true)
  })
})
