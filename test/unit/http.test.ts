import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import { HttpClient } from '../../src/core/http.js'

describe('core/http debug logging', () => {
  const apiBaseUrl = 'https://productboard-debug.test'

  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    vi.restoreAllMocks()
  })

  it('logs request/response details to stderr when debug is enabled', async () => {
    nock(apiBaseUrl)
      .get('/features')
      .query({ limit: '3' })
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, { data: [] }, { 'x-request-id': 'req-123' })

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    const client = new HttpClient({
      token: 'test-token',
      baseUrl: apiBaseUrl,
      debug: true,
    })

    await client.get('/features', { query: { limit: 3 } })

    const debugOutput = stderrSpy.mock.calls.map((call) => String(call[0])).join('')

    expect(debugOutput).toContain('DEBUG: GET /features?limit=3')
    expect(debugOutput).toContain('DEBUG: Request headers:')
    expect(debugOutput).toContain('"Authorization":"Bearer ***"')
    expect(debugOutput).toContain('DEBUG: GET /features?limit=3 → 200')
    expect(debugOutput).toContain('DEBUG: Response size:')
    expect(debugOutput).toContain('DEBUG: x-request-id: req-123')
    expect(debugOutput).not.toContain('test-token')
    expect(nock.isDone()).toBe(true)
  })
})
