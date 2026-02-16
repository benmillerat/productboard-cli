import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import CompaniesGet from '../../src/commands/companies/get.js'

describe('companies get command integration', () => {
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

  it('renders key-value company detail with stripped description html', async () => {
    nock(apiBaseUrl)
      .get('/companies/com_123')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: {
          id: 'com_123',
          name: 'Acme',
          domain: 'acme.example',
          sourceOrigin: 'salesforce',
          sourceRecordId: 'sf-123',
          description: '<p>Hello&nbsp;&lt;world&gt; &amp; team</p>',
        },
      })

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await CompaniesGet.run(['com_123', '--api-url', apiBaseUrl])

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')

    expect(output).toMatch(/description\s*\tHello <world> & team/)
    expect(output).not.toContain('<p>')
    expect(nock.isDone()).toBe(true)
  })
})
