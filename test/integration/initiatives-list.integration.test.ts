import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import InitiativesList from '../../src/commands/initiatives/list.js'

describe('initiatives list command integration', () => {
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

  it('renders curated initiative output including wide timeframe/url', async () => {
    nock(apiBaseUrl)
      .get('/initiatives')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [
          {
            id: 'ini_1',
            name: 'Onboarding revamp',
            owner: { email: 'owner@example.com' },
            updatedAt: '2026-02-16T13:00:00.000Z',
            timeframe: {
              startDate: '2026-03-01',
              endDate: '2026-03-31',
            },
            links: { html: 'https://example.test/initiatives/ini_1' },
          },
        ],
      })

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await InitiativesList.run([
      '--api-url',
      apiBaseUrl,
      '--output',
      'plain',
      '--wide',
      '--limit',
      '1',
    ])

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')

    expect(output).toContain('ID\tNAME\tOWNER\tUPDATED\tTIMEFRAME\tURL')
    expect(output).toContain('ini_1\tOnboarding revamp\towner@example.com')
    expect(output).toContain('2026-03-01 → 2026-03-31')
    expect(output).toContain('https://example.test/initiatives/ini_1')
    expect(nock.isDone()).toBe(true)
  })
})
