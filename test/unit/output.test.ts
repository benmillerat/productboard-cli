import { afterEach, describe, expect, it, vi } from 'vitest'

import { outputResult, serializeOutput } from '../../src/core/output.js'
import type { Presenter } from '../../src/core/presenter.js'

const testPresenter: Presenter = {
  resource: 'features',
  primaryPath: 'data',
  listColumns: [
    { header: 'ID', accessor: 'id' },
    { header: 'NAME', accessor: 'name', maxWidth: 5 },
  ],
  detailFields: [
    { label: 'id', accessor: 'id' },
    { label: 'name', accessor: 'name' },
  ],
}

describe('core/output', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serializes json output', () => {
    const payload = { id: 'fea_1', name: 'Alpha' }
    const output = serializeOutput(payload, 'json')

    expect(output).toContain('"id": "fea_1"')
  })

  it('renders presenter table output without box borders', () => {
    const output = serializeOutput(
      {
        data: [{ id: 'fea_1', name: 'Alphabet' }],
      },
      'table',
      { presenter: testPresenter },
    )

    expect(output).toContain('ID')
    expect(output).toContain('NAME')
    expect(output).toContain('Alph…')
    expect(output).not.toContain('┌')
  })

  it('renders plain output as TSV without truncation', () => {
    const output = serializeOutput(
      {
        data: [{ id: 'fea_1', name: 'Alphabet' }],
      },
      'plain',
      { presenter: testPresenter },
    )

    const lines = output.split('\n')
    expect(lines[0]).toBe('ID\tNAME')
    expect(lines[1]).toBe('fea_1\tAlphabet')
  })

  it('extracts primary data for --results-only json output', () => {
    const output = serializeOutput(
      {
        data: [{ id: 'fea_1' }],
        count: 1,
        hasMore: false,
      },
      'json',
      {
        presenter: testPresenter,
        resultsOnly: true,
      },
    )

    expect(output.trim()).toBe('[\n  {\n    "id": "fea_1"\n  }\n]')
  })

  it('supports quiet output inference', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    outputResult(() => {}, [{ id: 'fea_1' }, { id: 'fea_2' }], {
      format: 'json',
      quiet: true,
    })

    expect(writeSpy).toHaveBeenCalledWith('fea_1\nfea_2\n')
  })

  it('emits pagination hint to stderr for table/plain output when more results exist', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    const payload = {
      data: [{ id: 'fea_1', name: 'Alpha' }],
      hasMore: true,
      next: 'cursor_123',
    }

    outputResult(() => {}, payload, {
      format: 'table',
      quiet: false,
      presenter: testPresenter,
    })

    outputResult(() => {}, payload, {
      format: 'plain',
      quiet: false,
      presenter: testPresenter,
    })

    expect(stdoutSpy).toHaveBeenCalled()
    expect(stderrSpy).toHaveBeenCalledWith(
      '# More results available. Use --cursor <token> or --all to fetch more.\n',
    )
    expect(stderrSpy).toHaveBeenCalledTimes(2)
  })

  it('does not emit pagination hint for json output', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

    outputResult(
      () => {},
      {
        data: [{ id: 'fea_1', name: 'Alpha' }],
        hasMore: true,
        next: 'cursor_123',
      },
      {
        format: 'json',
        quiet: false,
        presenter: testPresenter,
      },
    )

    expect(stdoutSpy).toHaveBeenCalled()
    expect(stderrSpy).not.toHaveBeenCalled()
  })
})
