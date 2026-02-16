import { afterEach, describe, expect, it, vi } from 'vitest'

import { confirmOrThrow } from '../../src/core/confirm.js'

const confirmationRequiredMessage = 'Confirmation required. Use --yes to skip.'
const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')

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

describe('core/confirm', () => {
  afterEach(() => {
    restoreStdinTTY()
    vi.restoreAllMocks()
  })

  it('proceeds without prompting when yes=true', async () => {
    setStdinTTY(false)

    await expect(
      confirmOrThrow({
        yes: true,
        noInput: false,
        prompt: 'Delete feature fea_123?',
      }),
    ).resolves.toBeUndefined()
  })

  it('throws with exit code 2 when noInput=true and yes=false', async () => {
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

  it('throws with exit code 2 when stdin is non-interactive and yes=false', async () => {
    setStdinTTY(false)

    await expect(
      confirmOrThrow({
        yes: false,
        noInput: false,
        prompt: 'Delete feature fea_123?',
      }),
    ).rejects.toMatchObject({
      message: confirmationRequiredMessage,
      exitCode: 2,
    })
  })
})
