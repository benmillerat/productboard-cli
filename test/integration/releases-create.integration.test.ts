import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import ReleasesCreate from '../../src/commands/releases/create.js'

describe('releases create command integration', () => {
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

  it('creates a release from JSON payload', async () => {
    nock(apiBaseUrl)
      .post('/releases', {
        data: {
          name: 'Q4 rollout',
        },
      })
      .matchHeader('authorization', 'Bearer test-token')
      .reply(201, {
        data: {
          id: 'rel_123',
          name: 'Q4 rollout',
        },
      })

    const logSpy = vi.spyOn(ReleasesCreate.prototype, 'log').mockImplementation(() => undefined)

    await ReleasesCreate.run([
      '--api-url',
      apiBaseUrl,
      '--output',
      'json',
      '--data',
      '{"data":{"name":"Q4 rollout"}}',
    ])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const output = logSpy.mock.calls[0]?.[0]
    expect(typeof output).toBe('string')

    const payload = JSON.parse(String(output)) as {
      id: string
      name: string
    }

    expect(payload.id).toBe('rel_123')
    expect(payload.name).toBe('Q4 rollout')
    expect(nock.isDone()).toBe(true)
  })
})
