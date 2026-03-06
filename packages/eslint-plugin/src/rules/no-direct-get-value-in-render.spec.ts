import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noDirectGetValueInRender } from './no-direct-get-value-in-render.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

tester.run('no-direct-get-value-in-render', noDirectGetValueInRender, {
  valid: [
    {
      name: '.getValue() outside render return (e.g. assigning to variable before return)',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            const val = someObservable.getValue()
            return <div>{val}</div>
          }
        })
      `,
    },
    {
      name: '.getValue() outside Shade render entirely',
      code: `
        function setup() {
          return someObservable.getValue()
        }
      `,
    },
    {
      name: 'no .getValue() call at all',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: ({ useObservable }) => {
            const [user] = useObservable('user', userService.currentUser)
            return <div>{user.name}</div>
          }
        })
      `,
    },
    {
      name: '.getValue() inside event handler callback is fine (executes at event time)',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            return <div onkeyup={() => manager.selectedIndex.setValue(Math.max(0, obs.getValue() - 1))}>test</div>
          }
        })
      `,
    },
    {
      name: '.getValue() inside callback prop is fine (executes at call time)',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            return <Input getValidationResult={() => { const v = obs.getValue(); return v }} />
          }
        })
      `,
    },
  ],
  invalid: [
    {
      name: '.getValue() directly in JSX return expression',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            return <div>{someObservable.getValue()}</div>
          }
        })
      `,
      errors: [{ messageId: 'noDirectGetValue' }],
    },
    {
      name: '.getValue() in arrow function expression body (implicit return)',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => <div>{sessionService.currentUser.getValue()}</div>
        })
      `,
      errors: [{ messageId: 'noDirectGetValue' }],
    },
    {
      name: 'nested .getValue() in return expression',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => {
            return <div>{isLoading.getValue() ? 'loading' : 'done'}</div>
          }
        })
      `,
      errors: [{ messageId: 'noDirectGetValue' }],
    },
  ],
})
