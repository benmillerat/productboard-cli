import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, it } from 'vitest'

import {
  getActiveProfile,
  loadConfig,
  saveConfig,
  setActiveProfile,
  type CliConfig,
} from '../../src/core/config.js'
import { ConfigError } from '../../src/core/errors.js'

describe('core/config', () => {
  it('returns defaults when config file does not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pb-cli-config-'))
    const configPath = join(dir, 'config.json')

    const config = await loadConfig(configPath)
    expect(config.activeProfile).toBe('default')
    expect(config.defaults.output).toBe('table')
  })

  it('saves and loads merged config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pb-cli-config-'))
    const configPath = join(dir, 'config.json')

    const config: CliConfig = {
      activeProfile: 'work',
      profiles: {
        work: { baseUrl: 'https://example.test', defaultOutput: 'json' },
      },
      defaults: {
        output: 'json',
        quiet: true,
        timeoutMs: 12_000,
        maxRetries: 5,
      },
    }

    await saveConfig(config, configPath)

    const raw = await readFile(configPath, 'utf8')
    expect(raw.endsWith('\n')).toBe(true)

    const loaded = await loadConfig(configPath)
    expect(loaded.activeProfile).toBe('work')
    expect(loaded.profiles.work?.baseUrl).toBe('https://example.test')
    expect(loaded.defaults.maxRetries).toBe(5)
  })

  it('sets active profile and creates it when missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pb-cli-config-'))
    const configPath = join(dir, 'config.json')

    await setActiveProfile('sandbox', configPath)

    await expect(getActiveProfile(configPath)).resolves.toBe('sandbox')
    const loaded = await loadConfig(configPath)
    expect(loaded.profiles.sandbox).toBeDefined()
  })

  it('throws a ConfigError on invalid JSON', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pb-cli-config-'))
    const configPath = join(dir, 'config.json')
    await writeFile(configPath, '{not-json', 'utf8')

    await expect(loadConfig(configPath)).rejects.toBeInstanceOf(ConfigError)
  })
})
