import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import FeaturesList from '../../src/commands/features/list.js'

describe('features list command integration', () => {
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

  it('lists features across paginated responses', async () => {
    nock(apiBaseUrl)
      .get('/features')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [
          { id: 'fea_1', name: 'Alpha', status: { name: 'Planned' } },
          { id: 'fea_2', name: 'Beta', status: { name: 'Done' } },
        ],
        links: {
          next: `${apiBaseUrl}/features?page=2`,
        },
      })

    nock(apiBaseUrl)
      .get('/features')
      .query({ page: '2' })
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [{ id: 'fea_3', name: 'Gamma', status: { name: 'Planned' } }],
      })

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await FeaturesList.run(['--api-url', apiBaseUrl, '--output', 'json', '--limit', '3'])

    expect(stdoutSpy).toHaveBeenCalled()
    const output = stdoutSpy.mock.calls.map(c => String(c[0])).join('')
    expect(typeof output).toBe('string')

    const payload = JSON.parse(String(output)) as {
      count: number
      hasMore: boolean
      data: Array<{ id: string }>
    }

    expect(payload.count).toBe(3)
    expect(payload.hasMore).toBe(false)
    expect(payload.data.map((item) => item.id)).toEqual(['fea_1', 'fea_2', 'fea_3'])
    expect(nock.isDone()).toBe(true)
  })

  it('writes debug HTTP logs to stderr when --debug is enabled', async () => {
    nock(apiBaseUrl)
      .get('/features')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [{ id: 'fea_1', name: 'Alpha', status: { name: 'Planned' } }],
      }, {
        'x-request-id': 'req_debug_123',
      })

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    await FeaturesList.run([
      '--api-url',
      apiBaseUrl,
      '--output',
      'json',
      '--limit',
      '1',
      '--debug',
    ])

    const debugOutput = stderrSpy.mock.calls.map((call) => String(call[0])).join('')

    expect(stdoutSpy).toHaveBeenCalled()
    expect(debugOutput).toContain('→ GET /features')
    expect(debugOutput).toContain('← 200')
    expect(debugOutput).toContain('[req-id: req_debug_123]')
    expect(debugOutput).not.toContain('test-token')
    expect(nock.isDone()).toBe(true)
  })
})
