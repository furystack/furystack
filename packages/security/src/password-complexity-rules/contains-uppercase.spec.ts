import type { PasswordComplexityFailedResult } from '../models'
import { createContainsUppercasePolicy } from './contains-uppercase'

describe('Contains-uppercase', () => {
  it('Should fail if the password is shorter than expected', async () => {
    const policy = createContainsUppercasePolicy(3)
    const result = await policy.check('')
    expect(result.success).toBe(false)
    expect((result as PasswordComplexityFailedResult).message).toBe(
      'The password should contain at least 3 upper case characters',
    )
  })

  it('Should fail if the password does not contain enough lowercase chars', async () => {
    const policy = createContainsUppercasePolicy(3)
    const result = await policy.check('asd12345(=/!+')
    expect(result.success).toBe(false)
    expect((result as PasswordComplexityFailedResult).message).toBe(
      'The password should contain at least 3 upper case characters',
    )
  })

  it('Should succeed if the password contains enough lowercase chars', async () => {
    const policy = createContainsUppercasePolicy(3)
    const result = await policy.check('ASD')
    expect(result.success).toBe(true)
  })

  it('Should succeed if the password contains enough lowercase chars supporting special ones', async () => {
    const policy = createContainsUppercasePolicy(3)
    const result = await policy.check('ÉÁÍ')
    expect(result.success).toBe(true)
  })
})
