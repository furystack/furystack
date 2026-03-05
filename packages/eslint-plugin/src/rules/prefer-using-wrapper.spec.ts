import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { preferUsingWrapper } from './prefer-using-wrapper.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('prefer-using-wrapper', preferUsingWrapper, {
  valid: [
    {
      name: 'already using usingAsync wrapper',
      code: `
        async function test() {
          await usingAsync(new Injector(), async (injector) => {
            const service = injector.getInstance(MyService)
          })
        }
      `,
    },
    {
      name: 'testing post-disposal behavior (expect follows dispose)',
      code: `
        async function test() {
          const i = new Injector()
          await i[Symbol.asyncDispose]()
          expect(() => i.getInstance(Injector)).toThrowError('Injector already disposed')
        }
      `,
    },
    {
      name: 'dispose on a non-local variable',
      code: `
        function cleanup(service) {
          service[Symbol.dispose]()
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'manual async dispose in same scope',
      code: `
        async function test() {
          const injector = new Injector()
          const svc = injector.getInstance(Svc)
          await injector[Symbol.asyncDispose]()
        }
      `,
      errors: [{ messageId: 'preferUsingAsync', data: { varName: 'injector' } }],
    },
    {
      name: 'manual sync dispose in same scope',
      code: `
        function test() {
          const obs = new ObservableValue(0)
          obs.setValue(1)
          obs[Symbol.dispose]()
        }
      `,
      errors: [{ messageId: 'preferUsing', data: { varName: 'obs' } }],
    },
  ],
})
