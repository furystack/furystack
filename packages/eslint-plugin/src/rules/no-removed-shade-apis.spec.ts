import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noRemovedShadeApis } from './no-removed-shade-apis.js'

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

tester.run('no-removed-shade-apis', noRemovedShadeApis, {
  valid: [
    {
      name: 'Shade with useHostProps is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useHostProps, props }) => {
            useHostProps({ 'data-active': 'true' })
            return null
          },
        })
      `,
    },
    {
      name: 'Shade with useDisposable is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ useDisposable }) => {
            useDisposable('cleanup', () => ({ [Symbol.dispose]() {} }))
            return null
          },
        })
      `,
    },
    {
      name: 'non-Shade call with onAttach is fine',
      code: `
        createWidget({
          onAttach: () => {},
          onDetach: () => {},
        })
      `,
    },
  ],
  invalid: [
    {
      name: 'onAttach in Shade options',
      code: `
        Shade({
          customElementName: 'my-comp',
          onAttach: ({ element }) => { element.focus() },
          render: () => null,
        })
      `,
      errors: [{ messageId: 'noOnAttach' }],
    },
    {
      name: 'onDetach in Shade options',
      code: `
        Shade({
          customElementName: 'my-comp',
          onDetach: ({ element }) => {},
          render: () => null,
        })
      `,
      errors: [{ messageId: 'noOnDetach' }],
    },
    {
      name: 'element destructured in render',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: ({ element, props }) => {
            element.setAttribute('data-active', 'true')
            return null
          },
        })
      `,
      errors: [{ messageId: 'noElement' }],
    },
    {
      name: 'both onAttach and onDetach',
      code: `
        Shade({
          customElementName: 'my-comp',
          onAttach: () => {},
          onDetach: () => {},
          render: () => null,
        })
      `,
      errors: [{ messageId: 'noOnAttach' }, { messageId: 'noOnDetach' }],
    },
    {
      name: 'shadowDomName is renamed to customElementName',
      code: `
        Shade({
          shadowDomName: 'my-comp',
          render: () => null,
        })
      `,
      errors: [{ messageId: 'noShadowDomName' }],
      output: `
        Shade({
          customElementName: 'my-comp',
          render: () => null,
        })
      `,
    },
  ],
})
