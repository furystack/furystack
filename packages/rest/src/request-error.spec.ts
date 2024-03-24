import { RequestError } from './request-error.js'
import { describe, expect, it } from 'vitest'

describe('RequestError', () => {
  it('Should be constructed', () => {
    const error = new RequestError('unauthorized', 401)
    expect(error).toBeInstanceOf(Error)
    expect(error.responseCode).toBe(401)
    expect(error.message).toBe('unauthorized')
  })
})
