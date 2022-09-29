import type { PasswordComplexityFailedResult } from '../models'
import { createMaxLengthComplexityRule } from './max-length'

describe('max-length', () => {
  it('Should fail if the password is longer than expected', async () => {
    const policy = createMaxLengthComplexityRule(3)
    const result = await policy.check('asdasd123')
    expect(result.success).toBe(false)
    expect((result as PasswordComplexityFailedResult).message).toBe('The password has to be maximum 3 character length')
  })

  it('Should fail if the password does not contain enough lowercase chars', async () => {
    const policy = createMaxLengthComplexityRule(3)
    const result = await policy.check('asd')
    expect(result.success).toBe(true)
  })
})
