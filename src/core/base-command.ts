import { Command, Flags } from '@oclif/core'

import { requireToken } from './auth.js'
import { getProfileConfig } from './config.js'
import { CliError } from './errors.js'
import { HttpClient } from './http.js'
import { OUTPUT_FORMATS, outputFlags, type OutputFormat } from './output.js'

export const commonFlags = {
  ...outputFlags,
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
  client: HttpClient
}

function resolveOutputFlag(rawOutput: string | undefined, fallback: OutputFormat): OutputFormat {
  if (rawOutput && OUTPUT_FORMATS.includes(rawOutput as OutputFormat)) {
    return rawOutput as OutputFormat
  }

  return fallback
}

export abstract class BaseCommand extends Command {
  protected async initRuntime(flags: {
    token?: string
    profile?: string
    output?: string
    quiet?: boolean
    'api-url'?: string
  }): Promise<RuntimeContext> {
    const { profileName, profile, config } = await getProfileConfig(flags.profile)
    const token = await requireToken({
      flagToken: flags.token,
      envToken: process.env.PRODUCTBOARD_API_TOKEN,
      profile: profileName,
    })

    const output = resolveOutputFlag(flags.output, profile.defaultOutput ?? config.defaults.output)
    const quiet = flags.quiet ?? config.defaults.quiet

    const client = new HttpClient({
      token,
      baseUrl: flags['api-url'] ?? profile.baseUrl,
      timeoutMs: config.defaults.timeoutMs,
      maxRetries: config.defaults.maxRetries,
    })

    return {
      profileName,
      output,
      quiet,
      client,
    }
  }

  protected async initOutput(flags: {
    profile?: string
    output?: string
    quiet?: boolean
  }): Promise<{ profileName: string; output: OutputFormat; quiet: boolean }> {
    const { profileName, profile, config } = await getProfileConfig(flags.profile)

    return {
      profileName,
      output: resolveOutputFlag(flags.output, profile.defaultOutput ?? config.defaults.output),
      quiet: flags.quiet ?? config.defaults.quiet,
    }
  }

  protected override async catch(error: Error & { exitCode?: number }): Promise<never> {
    if (error instanceof CliError) {
      this.error(error.message, { exit: error.exitCode })
    }

    throw error
  }
}
