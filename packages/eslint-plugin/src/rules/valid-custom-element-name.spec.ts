import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { validCustomElementName } from './valid-custom-element-name.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('valid-custom-element-name', validCustomElementName, {
  valid: [
    {
      name: 'valid hyphenated lowercase name',
      code: `Shade({ customElementName: 'my-component', render: () => null })`,
    },
    {
      name: 'valid multi-hyphen name',
      code: `Shade({ customElementName: 'shade-data-grid-row', render: () => null })`,
    },
    {
      name: 'non-Shade call is ignored',
      code: `Other({ customElementName: 'NoHyphen' })`,
    },
    {
      name: 'valid name with requiredPrefix option',
      code: `Shade({ customElementName: 'shade-my-widget', render: () => null })`,
      options: [{ requiredPrefix: 'shade-' }],
    },
  ],
  invalid: [
    {
      name: 'missing hyphen',
      code: `Shade({ customElementName: 'mycomponent', render: () => null })`,
      errors: [{ messageId: 'missingHyphen', data: { name: 'mycomponent' } }],
    },
    {
      name: 'auto-fix: uppercase letters lowercased',
      code: `Shade({ customElementName: 'My-Component', render: () => null })`,
      errors: [{ messageId: 'notLowercase', data: { name: 'My-Component' } }],
      output: `Shade({ customElementName: 'my-component', render: () => null })`,
    },
    {
      name: 'starts with hyphen',
      code: `Shade({ customElementName: '-my-component', render: () => null })`,
      errors: [{ messageId: 'invalidStart', data: { name: '-my-component' } }],
    },
    {
      name: 'starts with digit',
      code: `Shade({ customElementName: '3d-viewer', render: () => null })`,
      errors: [{ messageId: 'invalidStart', data: { name: '3d-viewer' } }],
    },
    {
      name: 'multiple issues: uppercase and no hyphen (only lowercase is auto-fixed)',
      code: `Shade({ customElementName: 'MyComponent', render: () => null })`,
      errors: [
        { messageId: 'missingHyphen', data: { name: 'MyComponent' } },
        { messageId: 'notLowercase', data: { name: 'MyComponent' } },
      ],
      output: `Shade({ customElementName: 'mycomponent', render: () => null })`,
    },
    {
      name: 'missing required prefix',
      code: `Shade({ customElementName: 'my-component', render: () => null })`,
      options: [{ requiredPrefix: 'shade-' }],
      errors: [{ messageId: 'missingPrefix', data: { name: 'my-component', prefix: 'shade-' } }],
    },
    {
      name: 'name matches prefix passes validation',
      code: `Shade({ customElementName: 'app-widget', render: () => null })`,
      options: [{ requiredPrefix: 'shade-' }],
      errors: [{ messageId: 'missingPrefix', data: { name: 'app-widget', prefix: 'shade-' } }],
    },
  ],
})
