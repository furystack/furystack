import { describe, expect, it } from 'vitest'
import { AuthorizationError } from './index.js'

describe('AuthorizationError', () => {
  it('Should be constructed', () => {
    const error = new AuthorizationError()
    expect(error).toBeInstanceOf(Error)
  })
})
