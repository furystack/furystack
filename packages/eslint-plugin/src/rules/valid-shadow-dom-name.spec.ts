import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { validShadowDomName } from './valid-shadow-dom-name.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('valid-shadow-dom-name', validShadowDomName, {
  valid: [
    {
      name: 'valid hyphenated lowercase name',
      code: `Shade({ shadowDomName: 'my-component', render: () => null })`,
    },
    {
      name: 'valid multi-hyphen name',
      code: `Shade({ shadowDomName: 'shade-data-grid-row', render: () => null })`,
    },
    {
      name: 'non-Shade call is ignored',
      code: `Other({ shadowDomName: 'NoHyphen' })`,
    },
  ],
  invalid: [
    {
      name: 'missing hyphen',
      code: `Shade({ shadowDomName: 'mycomponent', render: () => null })`,
      errors: [{ messageId: 'missingHyphen', data: { name: 'mycomponent' } }],
    },
    {
      name: 'auto-fix: uppercase letters lowercased',
      code: `Shade({ shadowDomName: 'My-Component', render: () => null })`,
      errors: [{ messageId: 'notLowercase', data: { name: 'My-Component' } }],
      output: `Shade({ shadowDomName: 'my-component', render: () => null })`,
    },
    {
      name: 'starts with hyphen',
      code: `Shade({ shadowDomName: '-my-component', render: () => null })`,
      errors: [{ messageId: 'invalidStart', data: { name: '-my-component' } }],
    },
    {
      name: 'starts with digit',
      code: `Shade({ shadowDomName: '3d-viewer', render: () => null })`,
      errors: [{ messageId: 'invalidStart', data: { name: '3d-viewer' } }],
    },
    {
      name: 'multiple issues: uppercase and no hyphen (only lowercase is auto-fixed)',
      code: `Shade({ shadowDomName: 'MyComponent', render: () => null })`,
      errors: [
        { messageId: 'missingHyphen', data: { name: 'MyComponent' } },
        { messageId: 'notLowercase', data: { name: 'MyComponent' } },
      ],
      output: `Shade({ shadowDomName: 'mycomponent', render: () => null })`,
    },
  ],
})
