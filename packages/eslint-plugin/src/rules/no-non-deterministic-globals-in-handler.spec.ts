import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noNonDeterministicGlobalsInHandler } from './no-non-deterministic-globals-in-handler.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('no-non-deterministic-globals-in-handler', noNonDeterministicGlobalsInHandler, {
  valid: [
    {
      name: 'ctx.now() inside handler is fine',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            const t = ctx.now()
            return t.toISOString()
          },
        })
      `,
    },
    {
      name: 'Date.now() outside any handler is fine',
      code: `
        const stamp = () => Date.now()
        const r = Math.random()
        setTimeout(() => {}, 100)
      `,
    },
    {
      name: 'Date with explicit argument is deterministic',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            const epoch = new Date(0)
            return epoch
          },
        })
      `,
    },
    {
      name: 'object property called fetch is unrelated',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            const result = ctx.fetch('https://example.com')
            return result
          },
        })
      `,
    },
    {
      name: 'unrelated define call is not constrained',
      code: `
        defineSomethingElse({
          handler: async () => {
            return Date.now()
          },
        })
      `,
    },
  ],
  invalid: [
    {
      name: 'Date.now inside handler is forbidden',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            return Date.now()
          },
        })
      `,
      errors: [{ messageId: 'forbiddenGlobal' }],
    },
    {
      name: 'Math.random inside handler is forbidden',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            return Math.random()
          },
        })
      `,
      errors: [{ messageId: 'forbiddenGlobal' }],
    },
    {
      name: 'setTimeout inside handler is forbidden',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            setTimeout(() => {}, 100)
          },
        })
      `,
      errors: [{ messageId: 'forbiddenGlobal' }],
    },
    {
      name: 'fetch inside handler is forbidden',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            const r = await fetch('https://example.com')
            return r
          },
        })
      `,
      errors: [{ messageId: 'forbiddenGlobal' }],
    },
    {
      name: 'crypto.randomUUID inside handler is forbidden',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            return crypto.randomUUID()
          },
        })
      `,
      errors: [{ messageId: 'forbiddenGlobal' }],
    },
    {
      name: 'new Date() with no args inside handler is forbidden',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            return new Date()
          },
        })
      `,
      errors: [{ messageId: 'forbiddenNewDate' }],
    },
    {
      name: 'forbidden global inside nested helper inside handler',
      code: `
        defineTaskHandler({
          type: 'echo',
          version: 1,
          handler: async (ctx) => {
            const helper = () => Math.random()
            return helper()
          },
        })
      `,
      errors: [{ messageId: 'forbiddenGlobal' }],
    },
  ],
})
