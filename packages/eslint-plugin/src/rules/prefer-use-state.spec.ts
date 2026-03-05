import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { preferUseState } from './prefer-use-state.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('prefer-use-state', preferUseState, {
  valid: [
    {
      name: 'useState is fine',
      code: `
        function render({ useState }) {
          const [count, setCount] = useState('count', 0)
        }
      `,
    },
    {
      name: 'useDisposable with non-ObservableValue is fine',
      code: `
        function render({ useDisposable }) {
          const ws = useDisposable('ws', () => new WebSocket('ws://test'))
        }
      `,
    },
    {
      name: 'useDisposable with ObservableValue but no useObservable is fine (shared state)',
      code: `
        function render({ useDisposable }) {
          const obs = useDisposable('shared', () => new ObservableValue(0))
          service.register(obs)
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'useDisposable + useObservable with matching keys',
      code: `
        function render({ useDisposable, useObservable }) {
          const obs = useDisposable('count', () => new ObservableValue(0))
          const [count] = useObservable('count', obs)
        }
      `,
      errors: [{ messageId: 'preferUseState', data: { key: 'count' } }],
    },
    {
      name: 'useDisposable with block body factory + useObservable',
      code: `
        function render({ useDisposable, useObservable }) {
          const obs = useDisposable('editing', () => { return new ObservableValue(false) })
          const [isEditing] = useObservable('editing', obs)
        }
      `,
      errors: [{ messageId: 'preferUseState', data: { key: 'editing' } }],
    },
  ],
})
