import { afterEach, describe, expect, it, vi } from 'vitest'

import { outputResult, serializeOutput } from '../../src/core/output.js'

describe('core/output', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serializes json output', () => {
    const payload = { id: 'fea_1', name: 'Alpha' }
    const output = serializeOutput(payload, 'json')

    expect(output).toContain('"id": "fea_1"')
  })

  it('renders table output for arrays', () => {
    const output = serializeOutput(
      [
        { id: 'fea_1', name: 'Alpha' },
        { id: 'fea_2', name: 'Beta' },
      ],
      'table',
    )

    expect(output).toContain('fea_1')
    expect(output).toContain('Alpha')
  })

  it('supports quiet output inference', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    outputResult(() => {}, [{ id: 'fea_1' }, { id: 'fea_2' }], {
      format: 'json',
      quiet: true,
    })

    expect(writeSpy).toHaveBeenCalledWith('fea_1\nfea_2\n')
  })
})
