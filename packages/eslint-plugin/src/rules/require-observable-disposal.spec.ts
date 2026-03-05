import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { requireObservableDisposal } from './require-observable-disposal.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('require-observable-disposal', requireObservableDisposal, {
  valid: [
    {
      name: 'all ObservableValues disposed',
      code: `
        class MyService {
          public data = new ObservableValue(null)
          public count = new ObservableValue(0)
          public [Symbol.dispose]() {
            this.data[Symbol.dispose]()
            this.count[Symbol.dispose]()
          }
        }
      `,
    },
    {
      name: 'class without ObservableValues',
      code: `
        class MyService {
          public name = 'hello'
          public [Symbol.dispose]() {}
        }
      `,
    },
    {
      name: 'class without dispose method is handled by require-disposable-for-observable-owner',
      code: `
        class MyService {
          public data = new ObservableValue(null)
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'ObservableValue not disposed',
      code: `
        class ScreenService {
          public orientation = new ObservableValue('portrait')
          public [Symbol.dispose]() {
            window.removeEventListener('resize', this.onResizeListener)
          }
        }
      `,
      errors: [{ messageId: 'undisposedObservable', data: { fieldName: 'orientation' } }],
    },
    {
      name: 'partially disposed ObservableValues',
      code: `
        class MyService {
          public data = new ObservableValue(null)
          public findOptions = new ObservableValue({})
          public [Symbol.dispose]() {
            this.data[Symbol.dispose]()
          }
        }
      `,
      errors: [{ messageId: 'undisposedObservable', data: { fieldName: 'findOptions' } }],
    },
  ],
})
