import { describe, expect, it } from 'vitest'

import { ApiError, mapHttpError } from '../../src/core/errors.js'

describe('core/errors', () => {
  it('maps standard auth errors to user-friendly messages', () => {
    const error = mapHttpError(401, { message: 'raw' })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(error.message).toBe(
      'Authentication failed. Check your Productboard API token. (HTTP 401)',
    )
  })

  it('uses payload messages for unknown statuses', () => {
    const error = mapHttpError(500, { message: 'Internal failure from API' })

    expect(error.message).toBe('Internal failure from API')
    expect(error.status).toBe(500)
  })

  it('falls back to an HTTP status message when payload and body are empty', () => {
    const error = mapHttpError(503, {}, '')

    expect(error.message).toBe('Productboard API returned HTTP 503.')
    expect(error.status).toBe(503)
  })

  it('captures retry-after metadata for rate limiting', () => {
    const error = mapHttpError(429, { retryAfter: 9, message: 'slow down' })

    expect(error.message).toBe('Productboard API rate limit reached. Please retry shortly. (HTTP 429)')
    expect(error.retryAfterSeconds).toBe(9)
  })
})
