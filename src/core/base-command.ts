import { Command, Flags } from '@oclif/core'

import { requireToken } from './auth.js'
import { getProfileConfig } from './config.js'
import { CliError, ValidationError } from './errors.js'
import { HttpClient } from './http.js'
import { OUTPUT_FORMATS, outputFlags, type OutputFormat } from './output.js'

export const commonFlags = {
  ...outputFlags,
  yes: Flags.boolean({
    char: 'y',
    description: 'Skip confirmation prompts',
    default: false,
  }),
  'no-input': Flags.boolean({
    description: 'Never prompt; fail if confirmation needed (for CI/scripting)',
    default: false,
  }),
  debug: Flags.boolean({
    description: 'Enable debug output (HTTP details on stderr)',
    default: false,
  }),
  token: Flags.string({
    description: 'Productboard API token (overrides env and keychain)',
  }),
  profile: Flags.string({
    description: 'Profile name from local config',
  }),
  'api-url': Flags.string({
    description: 'Override Productboard API base URL',
    env: 'PRODUCTBOARD_API_URL',
  }),
} as const

export interface RuntimeContext {
  profileName: string
  output: OutputFormat
  quiet: boolean
  wide: boolean
  resultsOnly: boolean
  debug: boolean
  yes: boolean
  noInput: boolean
  client: HttpClient
}

export interface RuntimeOptions {
  apiVersion?: string
}

interface OutputFlagValues {
  output?: string
  plain?: boolean
  'results-only'?: boolean
}

function resolveOutputFlag(rawOutput: string | undefined, fallback: OutputFormat): OutputFormat {
  if (rawOutput && OUTPUT_FORMATS.includes(rawOutput as OutputFormat)) {
    return rawOutput as OutputFormat
  }

  return fallback
}

function resolveRequestedOutput(
  flags: OutputFlagValues,
  fallback: OutputFormat,
): { output: OutputFormat; resultsOnly: boolean } {
  const explicitOutput = resolveOutputFlag(flags.output, fallback)

  if (flags.plain && flags.output && flags.output !== 'plain') {
    throw new ValidationError('Cannot combine --plain with --output values other than "plain".')
  }

  const output = flags.plain ? 'plain' : explicitOutput
  const resultsOnly = flags['results-only'] ?? false

  if (resultsOnly && output !== 'json') {
    throw new ValidationError('--results-only can only be used with --output json.')
  }

  return { output, resultsOnly }
}

export abstract class BaseCommand extends Command {
  protected async initRuntime(
    flags: {
      token?: string
      profile?: string
      output?: string
      plain?: boolean
      quiet?: boolean
      wide?: boolean
      yes?: boolean
      'no-input'?: boolean
      debug?: boolean
      'results-only'?: boolean
      'api-url'?: string
    },
    options?: RuntimeOptions,
  ): Promise<RuntimeContext> {
    const { profileName, profile, config } = await getProfileConfig(flags.profile)
    const token = await requireToken({
      flagToken: flags.token,
      envToken: process.env.PRODUCTBOARD_API_TOKEN,
      profile: profileName,
    })

    const { output, resultsOnly } = resolveRequestedOutput(
      flags,
      profile.defaultOutput ?? config.defaults.output,
    )
    const quiet = flags.quiet ?? config.defaults.quiet
    const wide = flags.wide ?? false
    const yes = flags.yes ?? false
    const noInput = flags['no-input'] ?? false
    const debug = flags.debug ?? false

    const client = new HttpClient({
      token,
      baseUrl: flags['api-url'] ?? profile.baseUrl,
      apiVersion: options?.apiVersion,
      timeoutMs: config.defaults.timeoutMs,
      maxRetries: config.defaults.maxRetries,
      debug,
    })

    return {
      profileName,
      output,
      quiet,
      wide,
      resultsOnly,
      debug,
      yes,
      noInput,
      client,
    }
  }

  protected async initOutput(flags: {
    profile?: string
    output?: string
    plain?: boolean
    quiet?: boolean
    wide?: boolean
    yes?: boolean
    'no-input'?: boolean
    debug?: boolean
    'results-only'?: boolean
  }): Promise<{
    profileName: string
    output: OutputFormat
    quiet: boolean
    wide: boolean
    yes: boolean
    noInput: boolean
    debug: boolean
    resultsOnly: boolean
  }> {
    const { profileName, profile, config } = await getProfileConfig(flags.profile)
    const { output, resultsOnly } = resolveRequestedOutput(
      flags,
      profile.defaultOutput ?? config.defaults.output,
    )

    return {
      profileName,
      output,
      quiet: flags.quiet ?? config.defaults.quiet,
      wide: flags.wide ?? false,
      yes: flags.yes ?? false,
      noInput: flags['no-input'] ?? false,
      debug: flags.debug ?? false,
      resultsOnly,
    }
  }

  protected override async catch(error: Error & { exitCode?: number }): Promise<never> {
    if (error instanceof CliError) {
      this.error(error.message, { exit: error.exitCode })
    }

    throw error
  }
}
