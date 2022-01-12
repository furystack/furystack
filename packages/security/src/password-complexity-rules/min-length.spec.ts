import { PasswordComplexityFailedResult } from '..'
import { createMinLengthComplexityRule } from './min-length'

describe('min-length', () => {
  it('Should fail if the password is shorter than expected', async () => {
    const policy = createMinLengthComplexityRule(3)
    const result = await policy.check('')
    expect(result.success).toBe(false)
    expect((result as PasswordComplexityFailedResult).message).toBe(
      'The password has to be at least 3 character length',
    )
  })

  it('Should fail if the password does not contain enough lowercase chars', async () => {
    const policy = createMinLengthComplexityRule(3)
    const result = await policy.check('asd12345(=/!+')
    expect(result.success).toBe(true)
  })
})
