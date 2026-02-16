import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import FeaturesDelete from '../../src/commands/features/delete.js'

function extractExitCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const withOclif = error as {
    exitCode?: unknown
    oclif?: {
      exit?: unknown
    }
  }

  if (typeof withOclif.exitCode === 'number') {
    return withOclif.exitCode
  }

  if (typeof withOclif.oclif?.exit === 'number') {
    return withOclif.oclif.exit
  }

  return undefined
}

describe('features delete command integration', () => {
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

  it('requires confirmation when --no-input is set without --yes', async () => {
    const scope = nock(apiBaseUrl).delete('/features/fea_123').reply(204)

    let thrown: unknown
    try {
      await FeaturesDelete.run(['fea_123', '--api-url', apiBaseUrl, '--no-input'])
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeDefined()
    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toContain('Confirmation required. Use --yes to skip.')
    expect(extractExitCode(thrown)).toBe(2)
    expect(scope.isDone()).toBe(false)
  })

  it('proceeds without prompting when --yes is provided', async () => {
    nock(apiBaseUrl)
      .delete('/features/fea_123')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(204)

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await FeaturesDelete.run(['fea_123', '--api-url', apiBaseUrl, '--yes', '--output', 'json'])

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')
    const payload = JSON.parse(output) as { success: boolean; id: string }

    expect(payload.success).toBe(true)
    expect(payload.id).toBe('fea_123')
    expect(nock.isDone()).toBe(true)
  })
})
