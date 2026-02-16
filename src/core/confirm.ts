import { createInterface } from 'node:readline/promises'

import { ValidationError } from './errors.js'

export interface ConfirmOptions {
  yes: boolean
  noInput: boolean
  prompt: string
}

const confirmationRequiredMessage = 'Confirmation required. Use --yes to skip.'

function isConfirmed(input: string): boolean {
  const normalized = input.trim().toLowerCase()
  return normalized === 'y' || normalized === 'yes'
}

export async function confirmOrThrow(options: ConfirmOptions): Promise<void> {
  if (options.yes) {
    return
  }

  if (options.noInput || process.stdin.isTTY !== true) {
    throw new ValidationError(confirmationRequiredMessage)
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stderr,
  })

  try {
    const answer = await readline.question(`${options.prompt} [y/N] `)
    if (!isConfirmed(answer)) {
      throw new ValidationError('Confirmation declined.')
    }
  } finally {
    readline.close()
  }
}
