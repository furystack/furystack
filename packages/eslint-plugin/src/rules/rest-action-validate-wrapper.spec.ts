import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { restActionValidateWrapper } from './rest-action-validate-wrapper.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('rest-action-validate-wrapper', restActionValidateWrapper, {
  valid: [
    {
      name: 'endpoint wrapped with Validate()',
      code: `
        useRestService({
          api: {
            GET: {
              '/users': Validate({ schema, schemaName: 'GetUsers' })(getUsers),
            },
          },
        })
      `,
    },
    {
      name: 'multiple endpoints all wrapped with Validate()',
      code: `
        useRestService({
          api: {
            GET: {
              '/users': Validate({ schema, schemaName: 'GetUsers' })(getUsers),
              '/users/:id': Validate({ schema, schemaName: 'GetUser' })(getUser),
            },
            POST: {
              '/users': Validate({ schema, schemaName: 'CreateUser' })(createUser),
            },
          },
        })
      `,
    },
    {
      name: 'non-useRestService call is ignored',
      code: `
        setupRoutes({
          api: {
            GET: {
              '/users': getUsers,
            },
          },
        })
      `,
    },
    {
      name: 'property outside api block is ignored',
      code: `
        useRestService({
          injector: i,
          root: '/api',
          api: {
            GET: {
              '/users': Validate({ schema, schemaName: 'GetUsers' })(getUsers),
            },
          },
        })
      `,
    },
    {
      name: 'test files are excluded',
      filename: '/project/src/rest-service.integration.spec.ts',
      code: `
        useRestService({
          api: {
            GET: {
              '/users': GetUsers,
            },
          },
        })
      `,
    },
  ],
  invalid: [
    {
      name: 'endpoint without Validate() wrapper (identifier)',
      code: `
        useRestService({
          api: {
            GET: {
              '/users': GetUsers,
            },
          },
        })
      `,
      errors: [{ messageId: 'missingValidate', data: { endpoint: '/users' } }],
    },
    {
      name: 'endpoint without Validate() wrapper (inline arrow function)',
      code: `
        useRestService({
          api: {
            POST: {
              '/login': async (options) => JsonResult({ ok: true }),
            },
          },
        })
      `,
      errors: [{ messageId: 'missingValidate', data: { endpoint: '/login' } }],
    },
    {
      name: 'mixed: some with Validate, some without',
      code: `
        useRestService({
          api: {
            GET: {
              '/users': Validate({ schema, schemaName: 'GetUsers' })(getUsers),
              '/health': healthCheck,
            },
          },
        })
      `,
      errors: [{ messageId: 'missingValidate', data: { endpoint: '/health' } }],
    },
  ],
})
