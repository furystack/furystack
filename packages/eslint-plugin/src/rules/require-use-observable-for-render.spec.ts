import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { requireUseObservableForRender } from './require-use-observable-for-render.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

tester.run('require-use-observable-for-render', requireUseObservableForRender, {
  valid: [
    {
      name: 'useDisposable with ObservableValue paired with useObservable',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useDisposable, useObservable }) => {
            const loading = useDisposable('loading', () => new ObservableValue(false))
            const [isLoading] = useObservable('loading', loading)
            return <div>{isLoading}</div>
          }
        })
      `,
    },
    {
      name: 'useDisposable with ObservableValue but no .getValue() call',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useDisposable }) => {
            const loading = useDisposable('loading', () => new ObservableValue(false))
            loading.setValue(true)
            return <div>hello</div>
          }
        })
      `,
    },
    {
      name: 'useDisposable with non-ObservableValue is ignored',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useDisposable }) => {
            const service = useDisposable('svc', () => new SomeService())
            return <div>{service.getValue()}</div>
          }
        })
      `,
    },
    {
      name: 'outside of Shade render is ignored',
      code: `
        function regularFunction() {
          const x = useDisposable('x', () => new ObservableValue(0))
          return x.getValue()
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'useDisposable creates ObservableValue, .getValue() in render without useObservable',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useDisposable }) => {
            const loading = useDisposable('loading', () => new ObservableValue(false))
            return <div>{loading.getValue()}</div>
          }
        })
      `,
      errors: [{ messageId: 'missingUseObservable', data: { key: 'loading' } }],
    },
    {
      name: 'block body factory function',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useDisposable }) => {
            const error = useDisposable('error', () => { return new ObservableValue(null) })
            return <span>{error.getValue()}</span>
          }
        })
      `,
      errors: [{ messageId: 'missingUseObservable', data: { key: 'error' } }],
    },
  ],
})
