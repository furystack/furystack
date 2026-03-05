import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noModuleLevelJsx } from './no-module-level-jsx.js'

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

tester.run('no-module-level-jsx', noModuleLevelJsx, {
  valid: [
    {
      name: 'factory function returning JSX is fine',
      code: `const getIcon = (status) => (<Icon icon={status} />)`,
    },
    {
      name: 'function expression returning JSX is fine',
      code: `const getIcon = function(status) { return (<Icon icon={status} />) }`,
    },
    {
      name: 'plain data at module level is fine',
      code: `const colors = { success: 'green', error: 'red' }`,
    },
    {
      name: 'JSX inside a function body (not module level) is fine',
      code: `
        function render() {
          const icon = (<Icon />)
          return icon
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'JSX element stored at module level',
      code: `const myIcon = (<Icon icon={checkCircle} size={64} />)`,
      errors: [{ messageId: 'noModuleLevelJsx' }],
    },
    {
      name: 'object containing JSX at module level',
      code: `const icons = { success: (<Icon icon={check} />) }`,
      errors: [{ messageId: 'noModuleLevelJsx' }],
    },
    {
      name: 'array containing JSX at module level',
      code: `const items = [(<Icon icon={check} />), (<Icon icon={error} />)]`,
      errors: [{ messageId: 'noModuleLevelJsx' }],
    },
  ],
})
