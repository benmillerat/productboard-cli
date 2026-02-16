import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import FeatureStatusesList from '../../src/commands/feature-statuses/list.js'

describe('feature-statuses list command integration', () => {
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

  it('uses generic presenter in plain mode without [object Object]', async () => {
    nock(apiBaseUrl)
      .get('/feature-statuses')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [
          {
            id: 'st_1',
            name: 'Planned',
            metadata: {
              color: 'blue',
            },
          },
        ],
      })

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await FeatureStatusesList.run(['--api-url', apiBaseUrl, '--output', 'plain', '--limit', '1'])

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')

    expect(output).toContain('ID\tNAME\tMETADATA')
    expect(output).toContain('st_1\tPlanned\t{"color":"blue"}')
    expect(output).not.toContain('[object Object]')
    expect(nock.isDone()).toBe(true)
  })
})
