export class CliError extends Error {
  public readonly exitCode: number

  public constructor(message: string, exitCode = 1) {
    super(message)
    this.name = this.constructor.name
    this.exitCode = exitCode
  }
}

export class AuthError extends CliError {
  public constructor(message: string) {
    super(message, 2)
  }
}

export class ConfigError extends CliError {
  public constructor(message: string) {
    super(message, 2)
  }
}

export class ValidationError extends CliError {
  public constructor(message: string) {
    super(message, 2)
  }
}

export class ApiError extends CliError {
  public readonly status?: number
  public readonly details?: unknown
  public readonly retryAfterSeconds?: number

  public constructor(
    message: string,
    options?: {
      status?: number
      details?: unknown
      retryAfterSeconds?: number
    },
  ) {
    super(message, 1)
    this.status = options?.status
    this.details = options?.details
    this.retryAfterSeconds = options?.retryAfterSeconds
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const record = payload as Record<string, unknown>

  const directMessage = record.message
  if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
    return directMessage
  }

  const directTitle = record.title
  if (typeof directTitle === 'string' && directTitle.trim().length > 0) {
    return directTitle
  }

  const nestedError = record.error
  if (typeof nestedError === 'object' && nestedError !== null) {
    const nestedMessage = (nestedError as Record<string, unknown>).message
    if (typeof nestedMessage === 'string' && nestedMessage.trim().length > 0) {
      return nestedMessage
    }
  }

  const errors = record.errors
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0]
    if (typeof first === 'string' && first.trim().length > 0) {
      return first
    }

    if (typeof first === 'object' && first !== null) {
      const firstRecord = first as Record<string, unknown>
      const firstMessage = firstRecord.message
      if (typeof firstMessage === 'string' && firstMessage.trim().length > 0) {
        return firstMessage
      }

      const firstTitle = firstRecord.title
      if (typeof firstTitle === 'string' && firstTitle.trim().length > 0) {
        return firstTitle
      }

      const firstDetail = firstRecord.detail
      if (typeof firstDetail === 'string' && firstDetail.trim().length > 0) {
        return firstDetail
      }
    }
  }

  return undefined
}

export function mapHttpError(status: number, payload: unknown, rawText?: string): ApiError {
  const rawMessage =
    typeof rawText === 'string' && rawText.trim().length > 0 ? rawText.trim() : undefined
  const fallback = extractMessage(payload) ?? rawMessage ?? `Productboard API returned HTTP ${status}.`

  const defaultMessageByStatus: Record<number, string> = {
    401: 'Authentication failed. Check your Productboard API token. (HTTP 401)',
    403: 'Access denied by Productboard API. Verify token permissions. (HTTP 403)',
    404: 'Requested Productboard resource was not found. (HTTP 404)',
    422: 'Productboard rejected the request payload. Check field values and try again. (HTTP 422)',
    429: 'Productboard API rate limit reached. Please retry shortly. (HTTP 429)',
  }

  const retryAfter =
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as { retryAfter?: unknown }).retryAfter === 'number'
      ? (payload as { retryAfter: number }).retryAfter
      : undefined

  return new ApiError(defaultMessageByStatus[status] ?? fallback, {
    status,
    details: payload ?? rawText,
    retryAfterSeconds: retryAfter,
  })
}
