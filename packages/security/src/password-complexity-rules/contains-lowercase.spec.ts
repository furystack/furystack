import type { PasswordComplexityFailedResult } from '../models'
import { createContainsLowercasePolicy } from './contains-lowercase'
import { describe, it, expect } from 'vitest'

describe('Contains-lowercase', () => {
  it('Should fail if the password is shorter than expected', async () => {
    const policy = createContainsLowercasePolicy(3)
    const result = await policy.check('')
    expect(result.success).toBe(false)
    expect((result as PasswordComplexityFailedResult).message).toBe(
      'The password should contain at least 3 lower case characters',
    )
  })

  it('Should fail if the password does not contain enough lowercase chars', async () => {
    const policy = createContainsLowercasePolicy(3)
    const result = await policy.check('ASD12345(=/!+')
    expect(result.success).toBe(false)
    expect((result as PasswordComplexityFailedResult).message).toBe(
      'The password should contain at least 3 lower case characters',
    )
  })

  it('Should succeed if the password contains enough lowercase chars', async () => {
    const policy = createContainsLowercasePolicy(3)
    const result = await policy.check('asd')
    expect(result.success).toBe(true)
  })

  it('Should succeed if the password contains enough lowercase chars supporting special ones', async () => {
    const policy = createContainsLowercasePolicy(3)
    const result = await policy.check('éáő')
    expect(result.success).toBe(true)
  })
})
