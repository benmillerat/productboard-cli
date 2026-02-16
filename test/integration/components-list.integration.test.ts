import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import ComponentsList from '../../src/commands/components/list.js'

describe('components list command integration', () => {
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

  it('renders curated plain output for components', async () => {
    nock(apiBaseUrl)
      .get('/components')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: [
          {
            id: 'cmp_1',
            name: 'Core UX',
            description: '<p>Hidden in list</p>',
            owner: { email: 'owner@example.com' },
            updatedAt: '2026-02-16T13:00:00.000Z',
            parent: { product: { id: 'prd_1' } },
            links: { html: 'https://example.test/components/cmp_1' },
          },
        ],
      })

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await ComponentsList.run(['--api-url', apiBaseUrl, '--output', 'plain', '--limit', '1'])

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')

    expect(output).toContain('ID\tNAME\tOWNER\tUPDATED')
    expect(output).toContain('cmp_1\tCore UX\towner@example.com')
    expect(output).not.toContain('<p>')
    expect(nock.isDone()).toBe(true)
  })
})
