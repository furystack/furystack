import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noCssStateHooks } from './no-css-state-hooks.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('no-css-state-hooks', noCssStateHooks, {
  valid: [
    {
      name: 'useState with non-CSS key is fine',
      code: `const [count, setCount] = useState('count', 0)`,
    },
    {
      name: 'useState with a descriptive key is fine',
      code: `const [isEditing, setIsEditing] = useState('isEditing', false)`,
    },
    {
      name: 'non-useState call with hover key is fine',
      code: `const result = trackState('hover', false)`,
    },
  ],
  invalid: [
    {
      name: 'useState with hover key',
      code: `const [isHovered, setIsHovered] = useState('hover', false)`,
      errors: [{ messageId: 'noCssStateHook', data: { stateName: 'hover' } }],
    },
    {
      name: 'useState with isHovered key',
      code: `const [isHovered, setIsHovered] = useState('isHovered', false)`,
      errors: [{ messageId: 'noCssStateHook', data: { stateName: 'isHovered' } }],
    },
    {
      name: 'useState with focus key',
      code: `const [isFocused, setIsFocused] = useState('focus', false)`,
      errors: [{ messageId: 'noCssStateHook', data: { stateName: 'focus' } }],
    },
    {
      name: 'useState with isFocused key',
      code: `const [isFocused, setIsFocused] = useState('isFocused', false)`,
      errors: [{ messageId: 'noCssStateHook', data: { stateName: 'isFocused' } }],
    },
    {
      name: 'useState with active key',
      code: `const [isActive, setIsActive] = useState('active', false)`,
      errors: [{ messageId: 'noCssStateHook', data: { stateName: 'active' } }],
    },
    {
      name: 'useState with isPressed key',
      code: `const [isPressed, setIsPressed] = useState('isPressed', false)`,
      errors: [{ messageId: 'noCssStateHook', data: { stateName: 'isPressed' } }],
    },
  ],
})
