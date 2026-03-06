import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { injectableConsistentInject } from './injectable-consistent-inject.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('injectable-consistent-inject', injectableConsistentInject, {
  valid: [
    {
      name: 'correct: declare with matching type',
      code: `
        class MyService {
          @Injected(FooService)
          declare private readonly foo: FooService
        }
      `,
    },
    {
      name: 'correct: declare with factory function (no type check)',
      code: `
        class MyService {
          @Injected((injector) => injector.getInstance(FooService))
          declare private readonly foo: Injector
        }
      `,
    },
    {
      name: 'correct: declare public with matching type',
      code: `
        class MyService {
          @Injected(BarService)
          declare public bar: BarService
        }
      `,
    },
    {
      name: 'non-Injected decorator is ignored',
      code: `
        class MyService {
          @SomeDecorator(FooService)
          bar: FooService
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'missing declare keyword',
      code: `
        class MyService {
          @Injected(FooService)
          private readonly foo: FooService
        }
      `,
      errors: [{ messageId: 'missingDeclare', data: { name: 'foo', type: 'FooService' } }],
    },
    {
      name: 'type mismatch between decorator arg and property type',
      code: `
        class MyService {
          @Injected(FooService)
          declare private readonly bar: BarService
        }
      `,
      errors: [
        {
          messageId: 'typeMismatch',
          data: { decoratorArg: 'FooService', name: 'bar', propertyType: 'BarService' },
        },
      ],
    },
    {
      name: 'both missing declare and type mismatch',
      code: `
        class MyService {
          @Injected(FooService)
          private bar: BarService
        }
      `,
      errors: [
        { messageId: 'missingDeclare', data: { name: 'bar', type: 'BarService' } },
        {
          messageId: 'typeMismatch',
          data: { decoratorArg: 'FooService', name: 'bar', propertyType: 'BarService' },
        },
      ],
    },
  ],
})
