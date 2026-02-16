import { ApiError, mapHttpError } from './errors.js'

export const PRODUCTBOARD_BASE_URL = 'https://api.productboard.com'
export const PRODUCTBOARD_API_VERSION = '1'
export const PRODUCTBOARD_API_VERSION_V2 = '2'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface HttpClientOptions {
  token: string
  baseUrl?: string
  apiVersion?: string
  timeoutMs?: number
  maxRetries?: number
  debug?: boolean
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  headers?: Record<string, string>
  absoluteUrl?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) {
    return undefined
  }

  const numeric = Number(headerValue)
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric
  }

  const dateValue = Date.parse(headerValue)
  if (Number.isNaN(dateValue)) {
    return undefined
  }

  const diffSeconds = Math.ceil((dateValue - Date.now()) / 1000)
  return diffSeconds > 0 ? diffSeconds : undefined
}

function applyQuery(url: URL, query: Record<string, string | number | boolean | undefined>): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue
    }

    url.searchParams.set(key, String(value))
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function formatDebugPath(url: URL): string {
  const query = url.searchParams.toString()
  return query.length > 0 ? `${url.pathname}?${query}` : url.pathname
}

function maskHeaderValue(headerName: string, value: string): string {
  if (headerName.toLowerCase() !== 'authorization') {
    return value
  }

  if (/^bearer\s+/i.test(value)) {
    return 'Bearer ***'
  }

  return '***'
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [headerName, value] of Object.entries(headers)) {
    sanitized[headerName] = maskHeaderValue(headerName, value)
  }

  return sanitized
}

export class HttpClient {
  private readonly token: string
  private readonly baseUrl: string
  private readonly apiVersion: string
  private readonly timeoutMs: number
  private readonly maxRetries: number
  private readonly debug: boolean

  public constructor(options: HttpClientOptions) {
    this.token = options.token
    this.baseUrl = options.baseUrl ?? PRODUCTBOARD_BASE_URL
    this.apiVersion = options.apiVersion ?? PRODUCTBOARD_API_VERSION
    this.timeoutMs = options.timeoutMs ?? 30_000
    this.maxRetries = options.maxRetries ?? 3
    this.debug = options.debug ?? false
  }

  private logDebugLine(message: string): void {
    if (!this.debug) {
      return
    }

    process.stderr.write(`DEBUG: ${message}\n`)
  }

  private logDebugRequest(method: HttpMethod, url: URL, headers: Record<string, string>): void {
    if (!this.debug) {
      return
    }

    this.logDebugLine(`${method} ${formatDebugPath(url)}`)
    this.logDebugLine(`Request headers: ${JSON.stringify(sanitizeHeaders(headers))}`)
  }

  private logDebugResponse(
    method: HttpMethod,
    url: URL,
    response: Response,
    durationMs: number,
    responseSizeBytes: number,
  ): void {
    if (!this.debug) {
      return
    }

    this.logDebugLine(`${method} ${formatDebugPath(url)} → ${response.status} (${durationMs}ms)`)
    this.logDebugLine(`Response size: ${responseSizeBytes} bytes`)

    const requestId = response.headers.get('x-request-id')
    if (requestId) {
      this.logDebugLine(`x-request-id: ${requestId}`)
    }
  }

  private logDebugTransportError(
    method: HttpMethod,
    url: URL,
    error: unknown,
    durationMs: number,
  ): void {
    if (!this.debug) {
      return
    }

    const message = error instanceof Error ? error.message : String(error)
    this.logDebugLine(`${method} ${formatDebugPath(url)} → ERROR (${durationMs}ms): ${message}`)
  }

  public async get<TResponse>(
    path: string,
    options?: Omit<RequestOptions, 'body'>,
  ): Promise<TResponse> {
    return this.request<TResponse>('GET', path, options)
  }

  public async post<TResponse>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('POST', path, { ...options, body })
  }

  public async patch<TResponse>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('PATCH', path, { ...options, body })
  }

  public async put<TResponse>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('PUT', path, { ...options, body })
  }

  public async delete<TResponse>(
    path: string,
    options?: Omit<RequestOptions, 'body'>,
  ): Promise<TResponse> {
    return this.request<TResponse>('DELETE', path, options)
  }

  public async request<TResponse>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const url = options?.absoluteUrl ? new URL(options.absoluteUrl) : new URL(path, this.baseUrl)

    if (!options?.absoluteUrl && options?.query) {
      applyQuery(url, options.query)
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'X-Version': this.apiVersion,
      Accept: 'application/json',
      ...options?.headers,
    }

    const hasBody = options?.body !== undefined
    if (hasBody) {
      headers['Content-Type'] = 'application/json'
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
      const startedAt = Date.now()

      this.logDebugRequest(method, url, headers)

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: hasBody ? JSON.stringify(options?.body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        const rawText = await response.text()
        const durationMs = Date.now() - startedAt
        const responseSizeBytes = Buffer.byteLength(rawText, 'utf8')
        this.logDebugResponse(method, url, response, durationMs, responseSizeBytes)

        let payload: unknown

        if (rawText.length > 0) {
          try {
            payload = JSON.parse(rawText) as unknown
          } catch {
            payload = undefined
          }
        }

        if (response.ok) {
          if (rawText.length === 0) {
            return {} as TResponse
          }

          return (payload ?? rawText) as TResponse
        }

        if (response.status === 429 && attempt < this.maxRetries) {
          const retryAfterSeconds = parseRetryAfter(response.headers.get('retry-after'))
          const backoffSeconds = retryAfterSeconds ?? Math.min(2 ** attempt, 30)
          await sleep(backoffSeconds * 1000)
          continue
        }

        const statusPayload = toRecord(payload)
        if (statusPayload && response.status === 429) {
          statusPayload.retryAfter = parseRetryAfter(response.headers.get('retry-after'))
        }

        throw mapHttpError(response.status, payload ?? statusPayload ?? rawText, rawText)
      } catch (error) {
        clearTimeout(timeout)

        if (error instanceof ApiError) {
          throw error
        }

        const durationMs = Date.now() - startedAt
        this.logDebugTransportError(method, url, error, durationMs)

        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError(
            `Request timed out after ${Math.round(this.timeoutMs / 1000)} seconds.`,
          )
        }

        if (attempt < this.maxRetries) {
          await sleep(Math.min(2 ** attempt, 5) * 1000)
          continue
        }

        throw new ApiError(
          `Network error while contacting Productboard API: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    throw new ApiError('Unexpected HTTP request flow termination.')
  }
}
