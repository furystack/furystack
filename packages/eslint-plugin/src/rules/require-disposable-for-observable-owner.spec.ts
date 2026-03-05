import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { requireDisposableForObservableOwner } from './require-disposable-for-observable-owner.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('require-disposable-for-observable-owner', requireDisposableForObservableOwner, {
  valid: [
    {
      name: 'class with ObservableValue and Symbol.dispose',
      code: `
        class MyService {
          public data = new ObservableValue(null)
          public [Symbol.dispose]() {
            this.data[Symbol.dispose]()
          }
        }
      `,
    },
    {
      name: 'class with ObservableValue and Symbol.asyncDispose',
      code: `
        class MyService {
          public data = new ObservableValue(null)
          public async [Symbol.asyncDispose]() {
            this.data[Symbol.dispose]()
          }
        }
      `,
    },
    {
      name: 'class without ObservableValue does not need dispose',
      code: `
        class MyService {
          public name = 'hello'
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'class with ObservableValue but no dispose method',
      code: `
        class MyService {
          public data = new ObservableValue(null)
        }
      `,
      errors: [{ messageId: 'missingDisposable', data: { className: 'MyService' } }],
    },
    {
      name: 'class with multiple ObservableValues but no dispose method',
      code: `
        class LayoutService {
          public drawerState = new ObservableValue({})
          public appBarVisible = new ObservableValue(true)
        }
      `,
      errors: [{ messageId: 'missingDisposable', data: { className: 'LayoutService' } }],
    },
  ],
})
