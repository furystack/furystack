import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { requireTabindexWithSpatialNavTarget } from './require-tabindex-with-spatial-nav-target.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
})

tester.run('require-tabindex-with-spatial-nav-target', requireTabindexWithSpatialNavTarget, {
  valid: [
    {
      name: 'useHostProps with both data-spatial-nav-target and tabIndex',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            useHostProps({
              tabIndex: 0,
              'data-spatial-nav-target': '',
            })
            return <div />
          },
        })
      `,
    },
    {
      name: 'useHostProps with conditional tabIndex expression',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            const isFocused = true
            useHostProps({
              tabIndex: isFocused ? 0 : -1,
              'data-spatial-nav-target': '',
            })
            return <div />
          },
        })
      `,
    },
    {
      name: 'useHostProps without data-spatial-nav-target does not trigger',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            useHostProps({
              tabIndex: 0,
            })
            return <div />
          },
        })
      `,
    },
    {
      name: 'data-spatial-nav-target in spread conditional with tabIndex in parent object',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            const isInteractive = true
            useHostProps({
              tabIndex: -1,
              ...(isInteractive ? { 'data-spatial-nav-target': '' } : {}),
            })
            return <div />
          },
        })
      `,
    },
    {
      name: 'data-spatial-nav-target in spread with && and tabIndex in parent object',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            const isInteractive = true
            useHostProps({
              tabIndex: -1,
              ...(isInteractive && { 'data-spatial-nav-target': '' }),
            })
            return <div />
          },
        })
      `,
    },
    {
      name: 'JSX natively focusable button with data-spatial-nav-target',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <button data-spatial-nav-target="">Click</button>,
        })
      `,
    },
    {
      name: 'JSX natively focusable input with data-spatial-nav-target',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <input data-spatial-nav-target="" />,
        })
      `,
    },
    {
      name: 'JSX natively focusable select with data-spatial-nav-target',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <select data-spatial-nav-target=""><option>A</option></select>,
        })
      `,
    },
    {
      name: 'JSX natively focusable textarea with data-spatial-nav-target',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <textarea data-spatial-nav-target="" />,
        })
      `,
    },
    {
      name: 'JSX natively focusable anchor with data-spatial-nav-target',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <a data-spatial-nav-target="" href="/">Link</a>,
        })
      `,
    },
    {
      name: 'JSX custom element with both data-spatial-nav-target and tabIndex',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <my-widget data-spatial-nav-target="" tabIndex={0} />,
        })
      `,
    },
    {
      name: 'useHostProps outside Shade render does not trigger',
      code: `
        function setup() {
          useHostProps({
            'data-spatial-nav-target': '',
          })
        }
      `,
    },
    {
      name: 'JSX outside Shade render does not trigger',
      code: `
        function MyComponent() {
          return <my-widget data-spatial-nav-target="" />
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'useHostProps with data-spatial-nav-target but no tabIndex',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            useHostProps({
              'data-spatial-nav-target': '',
              role: 'option',
            })
            return <div />
          },
        })
      `,
      errors: [{ messageId: 'missingTabIndex' }],
    },
    {
      name: 'useHostProps with only data-spatial-nav-target',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            useHostProps({
              'data-spatial-nav-target': '',
            })
            return <div />
          },
        })
      `,
      errors: [{ messageId: 'missingTabIndex' }],
    },
    {
      name: 'JSX custom element with data-spatial-nav-target but no tabIndex',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <my-widget data-spatial-nav-target="" />,
        })
      `,
      errors: [{ messageId: 'missingTabIndex' }],
    },
    {
      name: 'JSX div with data-spatial-nav-target but no tabIndex',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <div data-spatial-nav-target="" />,
        })
      `,
      errors: [{ messageId: 'missingTabIndex' }],
    },
    {
      name: 'JSX custom element with lowercase tabindex is not accepted',
      code: `
        Shade({
          customElementName: 'my-component',
          render: () => <my-widget data-spatial-nav-target="" tabindex={0} />,
        })
      `,
      errors: [{ messageId: 'missingTabIndex' }],
    },
    {
      name: 'useHostProps with lowercase tabindex in spread is not accepted',
      code: `
        Shade({
          customElementName: 'my-component',
          render: ({ useHostProps }) => {
            const isInteractive = true
            useHostProps({
              ...(isInteractive ? { 'data-spatial-nav-target': '' } : {}),
              ...(isInteractive ? { tabindex: '0' } : {}),
            })
            return <div />
          },
        })
      `,
      errors: [{ messageId: 'missingTabIndex' }],
    },
  ],
})
