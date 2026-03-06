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
    {
      name: 'class with Cache and Symbol.dispose',
      code: `
        class DataService {
          private cache = new Cache({ load: async () => [] })
          public [Symbol.dispose]() {
            this.cache[Symbol.dispose]()
          }
        }
      `,
    },
    {
      name: 'class with .subscribe() and Symbol.dispose',
      code: `
        class ListenerService {
          private subscription = someObservable.subscribe(() => {})
          public [Symbol.dispose]() {
            this.subscription[Symbol.dispose]()
          }
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'auto-fix: inserts [Symbol.dispose]() with single field',
      code: ['class MyService {', '  public data = new ObservableValue(null)', '}'].join('\n'),
      errors: [{ messageId: 'missingDisposable', data: { className: 'MyService' } }],
      output: [
        'class MyService {',
        '  public data = new ObservableValue(null)',
        '',
        '  public [Symbol.dispose]() {',
        '    this.data[Symbol.dispose]()',
        '  }',
        '}',
      ].join('\n'),
    },
    {
      name: 'auto-fix: inserts [Symbol.dispose]() with multiple fields',
      code: [
        'class LayoutService {',
        '  public drawerState = new ObservableValue({})',
        '  public appBarVisible = new ObservableValue(true)',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'missingDisposable', data: { className: 'LayoutService' } }],
      output: [
        'class LayoutService {',
        '  public drawerState = new ObservableValue({})',
        '  public appBarVisible = new ObservableValue(true)',
        '',
        '  public [Symbol.dispose]() {',
        '    this.drawerState[Symbol.dispose]()',
        '    this.appBarVisible[Symbol.dispose]()',
        '  }',
        '}',
      ].join('\n'),
    },
    {
      name: 'auto-fix: inserts [Symbol.dispose]() for Cache field',
      code: ['class DataService {', '  private cache = new Cache({ load: async () => [] })', '}'].join('\n'),
      errors: [{ messageId: 'missingDisposable', data: { className: 'DataService' } }],
      output: [
        'class DataService {',
        '  private cache = new Cache({ load: async () => [] })',
        '',
        '  public [Symbol.dispose]() {',
        '    this.cache[Symbol.dispose]()',
        '  }',
        '}',
      ].join('\n'),
    },
    {
      name: 'reports .subscribe() without dispose (no auto-fix for subscriptions)',
      code: ['class ListenerService {', '  private subscription = someObservable.subscribe(() => {})', '}'].join('\n'),
      errors: [{ messageId: 'missingDisposable', data: { className: 'ListenerService' } }],
    },
  ],
})
