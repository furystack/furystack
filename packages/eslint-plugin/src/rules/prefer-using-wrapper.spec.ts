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
      name: 'testing post-disposal behavior (await expect follows dispose)',
      code: `
        async function test() {
          const i = new Injector()
          await i[Symbol.asyncDispose]()
          await expect(async () => await i[Symbol.asyncDispose]()).rejects.toThrowError('already disposed')
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
    {
      name: 'dispose inside finally block is already safe',
      code: `
        async function test() {
          const factory = new MongoClientFactory()
          try {
            factory.getClientFor('mongodb://localhost')
          } finally {
            await factory[Symbol.asyncDispose]()
          }
        }
      `,
    },
    {
      name: 'multiple disposes inside finally block',
      code: `
        async function test() {
          const service = new EntitySyncService({ wsUrl: 'ws://test' })
          const injector = new Injector()
          try {
            doWork(service, injector)
          } finally {
            service[Symbol.dispose]()
            await injector[Symbol.asyncDispose]()
          }
        }
      `,
    },
    {
      name: 'dispose delegation in returned object',
      code: `
        function createStore() {
          const hub = new EventHub()
          return {
            subscribe: hub.subscribe.bind(hub),
            [Symbol.dispose]: () => hub[Symbol.dispose](),
          }
        }
      `,
    },
    {
      name: 'async dispose delegation in returned object',
      code: `
        async function renderButton() {
          const injector = new Injector()
          initializeShadeRoot({ injector })
          return {
            injector,
            [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
          }
        }
      `,
    },
    {
      name: 'dispose inside expect callback (testing disposal throws)',
      code: `
        async function test() {
          const i = new Injector()
          i.getInstance(TestDisposableThrows)
          await expect(async () => await i[Symbol.asyncDispose]()).rejects.toThrowError('error')
        }
      `,
    },
    {
      name: 'dispose inside expect callback with chained assertion',
      code: `
        async function test() {
          const i = new Injector()
          await expect(async () => await i[Symbol.asyncDispose]()).rejects.toThrowErrorMatchingInlineSnapshot('snap')
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
