import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import CompaniesList from '../../src/commands/companies/list.js'

describe('companies list command integration', () => {
  const apiBaseUrl = 'https://productboard-mock.test'
  const originalToken = process.env.PRODUCTBOARD_API_TOKEN

  beforeEach(() => {
    process.env.PRODUCTBOARD_API_TOKEN = 'test-token'
    nock.disableNetConnect()
  })

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.PRODUCTBOARD_API_TOKEN
    } else {
      process.env.PRODUCTBOARD_API_TOKEN = originalToken
    }

    nock.cleanAll()
    nock.enableNetConnect()
    vi.restoreAllMocks()
  })

  it('lists companies across paginated responses', async () => {
    nock(apiBaseUrl)
      .get('/companies')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [
          { id: 'com_1', name: 'Acme' },
          { id: 'com_2', name: 'Globex' },
        ],
        links: {
          next: `${apiBaseUrl}/companies?page=2`,
        },
      })

    nock(apiBaseUrl)
      .get('/companies')
      .query({ page: '2' })
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [{ id: 'com_3', name: 'Initech' }],
      })

    const logSpy = vi.spyOn(CompaniesList.prototype, 'log').mockImplementation(() => undefined)

    await CompaniesList.run(['--api-url', apiBaseUrl, '--output', 'json', '--limit', '3'])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const output = logSpy.mock.calls[0]?.[0]
    expect(typeof output).toBe('string')

    const payload = JSON.parse(String(output)) as {
      count: number
      hasMore: boolean
      data: Array<{ id: string }>
    }

    expect(payload.count).toBe(3)
    expect(payload.hasMore).toBe(false)
    expect(payload.data.map((item) => item.id)).toEqual(['com_1', 'com_2', 'com_3'])
    expect(nock.isDone()).toBe(true)
  })
})
