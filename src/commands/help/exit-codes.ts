import { Command } from '@oclif/core'

const exitCodes = [
  { code: '0', meaning: 'Success' },
  { code: '1', meaning: 'Runtime/API/network error' },
  { code: '2', meaning: 'Usage/validation/config error (includes missing confirmation)' },
  { code: '4', meaning: 'Auth required or invalid' },
  { code: '5', meaning: 'Resource not found (404)' },
  { code: '130', meaning: 'Interrupted (Ctrl+C)' },
] as const

function renderExitCodesTable(): string {
  const codeWidth = Math.max('Code'.length, ...exitCodes.map((row) => row.code.length))
  const header = `${'Code'.padEnd(codeWidth)}  Meaning`
  const divider = `${'-'.repeat(codeWidth)}  -------`
  const rows = exitCodes.map((row) => `${row.code.padEnd(codeWidth)}  ${row.meaning}`)

  return [header, divider, ...rows].join('\n')
}

type ParsedAwareCommand = Command & { parsed?: boolean }

export default class HelpExitCodes extends Command {
  public static override description = 'Show pb CLI exit code reference'

  public override async run(): Promise<void> {
    await this.parse(HelpExitCodes)
    ;(this as ParsedAwareCommand).parsed = true
    this.log(renderExitCodesTable())
  }
}
