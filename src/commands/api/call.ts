import { Args, Flags } from '@oclif/core'

import { BaseCommand, commonFlags } from '../../core/base-command.js'
import { ValidationError } from '../../core/errors.js'
import type { HttpMethod } from '../../core/http.js'
import { outputResult } from '../../core/output.js'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']

function parseMethod(rawMethod: string): HttpMethod {
  const normalized = rawMethod.toUpperCase()
  if (METHODS.includes(normalized as HttpMethod)) {
    return normalized as HttpMethod
  }

  throw new ValidationError(`Unsupported HTTP method: ${rawMethod}. Allowed: ${METHODS.join(', ')}`)
}

function normalizePath(inputPath: string): string {
  if (
    inputPath.startsWith('http://') ||
    inputPath.startsWith('https://') ||
    inputPath.startsWith('/')
  ) {
    return inputPath
  }

  return `/${inputPath}`
}

function parseKeyValuePairs(
  entries: string[] | undefined,
  optionName: string,
): Record<string, string> {
  const output: Record<string, string> = {}

  for (const entry of entries ?? []) {
    const separatorIndex = entry.indexOf('=')
    if (separatorIndex <= 0 || separatorIndex === entry.length - 1) {
      throw new ValidationError(`Invalid ${optionName} value "${entry}". Expected key=value.`)
    }

    const key = entry.slice(0, separatorIndex).trim()
    const value = entry.slice(separatorIndex + 1).trim()

    if (!key || !value) {
      throw new ValidationError(`Invalid ${optionName} value "${entry}". Expected key=value.`)
    }

    output[key] = value
  }

  return output
}

function parseJsonBody(rawBody: string | undefined): unknown {
  if (!rawBody) {
    return undefined
  }

  try {
    return JSON.parse(rawBody) as unknown
  } catch {
    throw new ValidationError('Invalid JSON provided in --body.')
  }
}

export default class ApiCall extends BaseCommand {
  public static override description = 'Call any Productboard API endpoint directly'

  public static override examples = [
    '<%= config.bin %> api call GET /features',
    '<%= config.bin %> api call PATCH /features/fea_123 --body \'{"data":{"name":"New name"}}\'',
    '<%= config.bin %> api call GET /features --query limit=50',
  ]

  public static override args = {
    method: Args.string({
      description: 'HTTP method (GET, POST, PATCH, PUT, DELETE)',
      required: true,
    }),
    path: Args.string({
      description: 'API path, e.g. /features or /features/fea_123',
      required: true,
    }),
  }

  public static override flags = {
    ...commonFlags,
    body: Flags.string({ description: 'Request body as JSON string' }),
    query: Flags.string({
      description: 'Query parameter as key=value. Repeat for multiple values.',
      multiple: true,
    }),
    header: Flags.string({
      description: 'Extra HTTP header as key=value. Repeat for multiple headers.',
      multiple: true,
    }),
  }

  public override async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiCall)
    const runtime = await this.initRuntime(flags)

    const method = parseMethod(args.method)
    const path = normalizePath(args.path)
    const query = parseKeyValuePairs(flags.query, '--query')
    const headers = parseKeyValuePairs(flags.header, '--header')
    const body = parseJsonBody(flags.body)

    const response = await runtime.client.request(method, path, {
      query: Object.keys(query).length > 0 ? query : undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body,
    })

    outputResult(this.log, response, {
      format: runtime.output,
      quiet: runtime.quiet,
    })
  }
}
