import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import FeaturesList from '../../src/commands/features/list.js'

describe('pagination hint integration', () => {
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

  it('prints pagination hint to stderr in plain output', async () => {
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

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    await FeaturesList.run(['--api-url', apiBaseUrl, '--output', 'plain', '--limit', '2'])

    expect(stdoutSpy).toHaveBeenCalled()
    expect(stderrSpy).toHaveBeenCalledWith(
      '# More results available. Use --cursor <token> or --all to fetch more.\n',
    )
    expect(nock.isDone()).toBe(true)
  })
})
