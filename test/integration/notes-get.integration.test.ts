import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import NotesGet from '../../src/commands/notes/get.js'

describe('notes get command integration', () => {
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

  it('gets a note by id', async () => {
    nock(apiBaseUrl)
      .get('/notes/note_123')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(200, {
        data: {
          id: 'note_123',
          title: 'Voice of customer',
        },
      })

    const logSpy = vi.spyOn(NotesGet.prototype, 'log').mockImplementation(() => undefined)

    await NotesGet.run(['note_123', '--api-url', apiBaseUrl, '--output', 'json'])

    expect(logSpy).toHaveBeenCalledTimes(1)
    const output = logSpy.mock.calls[0]?.[0]
    expect(typeof output).toBe('string')

    const payload = JSON.parse(String(output)) as {
      id: string
      title: string
    }

    expect(payload.id).toBe('note_123')
    expect(payload.title).toBe('Voice of customer')
    expect(nock.isDone()).toBe(true)
  })

  it('prints only id when quiet mode is enabled', async () => {
    nock(apiBaseUrl).get('/notes/note_456').reply(200, {
      data: {
        id: 'note_456',
        title: 'Escalation note',
      },
    })

    const logSpy = vi.spyOn(NotesGet.prototype, 'log').mockImplementation(() => undefined)

    await NotesGet.run(['note_456', '--api-url', apiBaseUrl, '--quiet'])

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('note_456')
  })
})
