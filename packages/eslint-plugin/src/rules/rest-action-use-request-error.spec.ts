import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { restActionUseRequestError } from './rest-action-use-request-error.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('rest-action-use-request-error', restActionUseRequestError, {
  valid: [
    {
      name: 'throw new RequestError in action file',
      filename: '/project/src/actions/login.ts',
      code: `throw new RequestError('Login failed', 401)`,
    },
    {
      name: 'throw new Error in non-action file is ignored',
      filename: '/project/src/services/auth.ts',
      code: `throw new Error('Something went wrong')`,
    },
    {
      name: 'throw string literal in action file is ignored',
      filename: '/project/src/actions/login.ts',
      code: `throw 'an error'`,
    },
    {
      name: 'throw new CustomError in action file is ignored',
      filename: '/project/src/actions/login.ts',
      code: `throw new CustomError('custom')`,
    },
  ],
  invalid: [
    {
      name: 'throw new Error in action file',
      filename: '/project/src/actions/login.ts',
      code: `throw new Error('Login failed')`,
      errors: [{ messageId: 'useRequestError' }],
    },
    {
      name: 'throw new Error in nested actions directory',
      filename: '/project/service/src/user/actions/update-user.ts',
      code: `throw new Error('User not found')`,
      errors: [{ messageId: 'useRequestError' }],
    },
  ],
})
