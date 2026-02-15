import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

import { ConfigError } from './errors.js'
import type { OutputFormat } from './output.js'

export const DEFAULT_CONFIG_PATH = join(homedir(), '.config', 'productboard-cli', 'config.json')

export interface ProfileConfig {
  baseUrl?: string
  defaultOutput?: OutputFormat
}

export interface CliConfig {
  activeProfile: string
  profiles: Record<string, ProfileConfig>
  defaults: {
    output: OutputFormat
    quiet: boolean
    timeoutMs: number
    maxRetries: number
  }
}

const DEFAULT_CONFIG: CliConfig = {
  activeProfile: 'default',
  profiles: {
    default: {},
  },
  defaults: {
    output: 'table',
    quiet: false,
    timeoutMs: 30_000,
    maxRetries: 3,
  },
}

function isOutputFormat(value: unknown): value is OutputFormat {
  return value === 'table' || value === 'json' || value === 'yaml' || value === 'ndjson'
}

function mergeWithDefaults(raw: unknown): CliConfig {
  if (typeof raw !== 'object' || raw === null) {
    return structuredClone(DEFAULT_CONFIG)
  }

  const source = raw as Partial<CliConfig>

  const defaults: Partial<CliConfig['defaults']> = source.defaults ?? {}
  const merged: CliConfig = {
    activeProfile:
      typeof source.activeProfile === 'string' && source.activeProfile.length > 0
        ? source.activeProfile
        : DEFAULT_CONFIG.activeProfile,
    profiles:
      typeof source.profiles === 'object' && source.profiles !== null ? source.profiles : {},
    defaults: {
      output: isOutputFormat(defaults.output) ? defaults.output : DEFAULT_CONFIG.defaults.output,
      quiet: typeof defaults.quiet === 'boolean' ? defaults.quiet : DEFAULT_CONFIG.defaults.quiet,
      timeoutMs:
        typeof defaults.timeoutMs === 'number' && defaults.timeoutMs > 0
          ? defaults.timeoutMs
          : DEFAULT_CONFIG.defaults.timeoutMs,
      maxRetries:
        typeof defaults.maxRetries === 'number' && defaults.maxRetries >= 0
          ? defaults.maxRetries
          : DEFAULT_CONFIG.defaults.maxRetries,
    },
  }

  if (!merged.profiles[merged.activeProfile]) {
    merged.profiles[merged.activeProfile] = {}
  }

  return merged
}

export async function loadConfig(configPath = DEFAULT_CONFIG_PATH): Promise<CliConfig> {
  try {
    const content = await readFile(configPath, 'utf8')
    return mergeWithDefaults(JSON.parse(content) as unknown)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return structuredClone(DEFAULT_CONFIG)
    }

    if (error instanceof SyntaxError) {
      throw new ConfigError(`Config file is not valid JSON: ${configPath}`)
    }

    throw new ConfigError(
      `Unable to read config file: ${configPath} (${error instanceof Error ? error.message : String(error)})`,
    )
  }
}

export async function saveConfig(
  config: CliConfig,
  configPath = DEFAULT_CONFIG_PATH,
): Promise<void> {
  const merged = mergeWithDefaults(config)
  const folder = dirname(configPath)

  await mkdir(folder, { recursive: true })
  await writeFile(configPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
}

export async function setActiveProfile(
  profile: string,
  configPath = DEFAULT_CONFIG_PATH,
): Promise<void> {
  if (!profile.trim()) {
    throw new ConfigError('Profile name cannot be empty.')
  }

  const config = await loadConfig(configPath)
  if (!config.profiles[profile]) {
    config.profiles[profile] = {}
  }

  config.activeProfile = profile
  await saveConfig(config, configPath)
}

export async function getActiveProfile(configPath = DEFAULT_CONFIG_PATH): Promise<string> {
  const config = await loadConfig(configPath)
  return config.activeProfile
}

export async function getProfileConfig(
  profile?: string,
  configPath = DEFAULT_CONFIG_PATH,
): Promise<{ profileName: string; profile: ProfileConfig; config: CliConfig }> {
  const config = await loadConfig(configPath)
  const profileName = profile ?? config.activeProfile
  const profileData = config.profiles[profileName] ?? {}

  return {
    profileName,
    profile: profileData,
    config,
  }
}
