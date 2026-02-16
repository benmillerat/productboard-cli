import { createInterface } from 'node:readline/promises'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import nock from 'nock'

import CompaniesDelete from '../../src/commands/companies/delete.js'
import FeaturesDelete from '../../src/commands/features/delete.js'
import V2EntitiesDelete from '../../src/commands/v2/entities/delete.js'
import { confirmOrThrow } from '../../src/core/confirm.js'

vi.mock('node:readline/promises', () => ({
  createInterface: vi.fn(),
}))

const confirmationRequiredMessage = 'Confirmation required. Use --yes to skip.'
const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
const createInterfaceMock = vi.mocked(createInterface)

interface MockReadline {
  question: ReturnType<typeof vi.fn<(prompt: string) => Promise<string>>>
  close: ReturnType<typeof vi.fn<() => void>>
}

function createMockReadline(answer: string): MockReadline {
  return {
    question: vi.fn(async () => answer),
    close: vi.fn(),
  }
}

function mockReadlineWithAnswer(answer: string): MockReadline {
  const mockReadline = createMockReadline(answer)
  createInterfaceMock.mockReturnValue(mockReadline as unknown as ReturnType<typeof createInterface>)
  return mockReadline
}

function setStdinTTY(value: boolean): void {
  Object.defineProperty(process.stdin, 'isTTY', {
    value,
    configurable: true,
  })
}

function restoreStdinTTY(): void {
  if (originalIsTTY) {
    Object.defineProperty(process.stdin, 'isTTY', originalIsTTY)
    return
  }

  Object.defineProperty(process.stdin, 'isTTY', {
    value: undefined,
    configurable: true,
  })
}

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

describe('core/confirm helper', () => {
  afterEach(() => {
    restoreStdinTTY()
    vi.restoreAllMocks()
  })

  it('prompts in interactive mode by default and includes resource type and ID', async () => {
    setStdinTTY(true)
    const mockReadline = mockReadlineWithAnswer('yes')

    await expect(
      confirmOrThrow({
        yes: false,
        noInput: false,
        prompt: 'Delete feature fea_123?',
      }),
    ).resolves.toBeUndefined()

    expect(createInterfaceMock).toHaveBeenCalledWith({
      input: process.stdin,
      output: process.stderr,
    })
    expect(mockReadline.question).toHaveBeenCalledWith('Delete feature fea_123? [y/N] ')
    expect(mockReadline.question).toHaveBeenCalledTimes(1)
    expect(mockReadline.close).toHaveBeenCalledTimes(1)
  })

  it('bypasses confirmation when --yes is set', async () => {
    setStdinTTY(true)

    await expect(
      confirmOrThrow({
        yes: true,
        noInput: false,
        prompt: 'Delete feature fea_123?',
      }),
    ).resolves.toBeUndefined()

    expect(createInterfaceMock).not.toHaveBeenCalled()
  })

  it('throws when --no-input is set without --yes', async () => {
    setStdinTTY(true)

    await expect(
      confirmOrThrow({
        yes: false,
        noInput: true,
        prompt: 'Delete feature fea_123?',
      }),
    ).rejects.toMatchObject({
      message: confirmationRequiredMessage,
      exitCode: 2,
    })
  })
})

describe('delete command confirmation spot checks', () => {
  const apiBaseUrl = 'https://productboard-confirm-mock.test'
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

    restoreStdinTTY()
    nock.cleanAll()
    nock.enableNetConnect()
    vi.restoreAllMocks()
  })

  it('features delete prompts with resource and ID before deleting', async () => {
    setStdinTTY(true)
    const mockReadline = mockReadlineWithAnswer('y')

    nock(apiBaseUrl)
      .delete('/features/fea_123')
      .matchHeader('authorization', 'Bearer test-token')
      .reply(204)

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await FeaturesDelete.run(['fea_123', '--api-url', apiBaseUrl, '--output', 'json'])

    expect(mockReadline.question).toHaveBeenCalledWith('Delete feature fea_123? [y/N] ')

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')
    const payload = JSON.parse(output) as { success: boolean; id: string }

    expect(payload.success).toBe(true)
    expect(payload.id).toBe('fea_123')
    expect(nock.isDone()).toBe(true)
  })

  it('companies delete fails in --no-input mode unless --yes is provided', async () => {
    setStdinTTY(true)
    const scope = nock(apiBaseUrl).delete('/companies/com_123').reply(204)

    let thrown: unknown
    try {
      await CompaniesDelete.run(['com_123', '--api-url', apiBaseUrl, '--no-input'])
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeDefined()
    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toContain(confirmationRequiredMessage)
    expect(extractExitCode(thrown)).toBe(2)
    expect(scope.isDone()).toBe(false)
  })

  it('v2 entities delete proceeds with --yes and uses API version 2', async () => {
    setStdinTTY(false)

    nock(apiBaseUrl)
      .delete('/v2/entities/ent_123')
      .matchHeader('authorization', 'Bearer test-token')
      .matchHeader('x-version', '2')
      .reply(204)

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await V2EntitiesDelete.run(['ent_123', '--api-url', apiBaseUrl, '--yes', '--output', 'json'])

    const output = stdoutSpy.mock.calls.map((call) => String(call[0])).join('')
    const payload = JSON.parse(output) as { success: boolean; id: string }

    expect(payload.success).toBe(true)
    expect(payload.id).toBe('ent_123')
    expect(nock.isDone()).toBe(true)
  })
})
