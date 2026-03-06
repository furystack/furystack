import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { preferLocationService } from './prefer-location-service.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('prefer-location-service', preferLocationService, {
  valid: [
    {
      name: 'LocationService.navigate() is fine',
      code: `locationService.navigate('/dashboard')`,
    },
    {
      name: 'unrelated pushState on a different object',
      code: `someObj.pushState({ data: true })`,
    },
    {
      name: 'unrelated replaceState on a different object',
      code: `router.replaceState({ page: 1 })`,
    },
    {
      name: 'history.pushState in test file is allowed',
      filename: 'src/navigation.spec.ts',
      code: `history.pushState(null, '', '/test')`,
    },
    {
      name: 'history.pushState in tsx test file is allowed',
      filename: 'src/navigation.spec.tsx',
      code: `history.pushState(null, '', '/test')`,
    },
    {
      name: 'history.pushState in file matching allowedPathPatterns',
      filename: 'src/services/navigate-to-route.ts',
      code: `history.pushState(null, '', '/dashboard')`,
      options: [{ allowedPathPatterns: ['navigate-to-route\\.ts$'] }],
    },
    {
      name: 'history.back() is fine',
      code: `history.back()`,
    },
    {
      name: 'window.history.back() is fine',
      code: `window.history.back()`,
    },
    {
      name: 'non-member pushState call is fine',
      code: `pushState(null, '', '/test')`,
    },
  ],
  invalid: [
    {
      name: 'history.pushState direct call',
      code: `history.pushState(null, '', '/dashboard')`,
      errors: [{ messageId: 'preferLocationService', data: { method: 'pushState' } }],
    },
    {
      name: 'history.replaceState direct call',
      code: `history.replaceState(null, '', '/dashboard')`,
      errors: [{ messageId: 'preferLocationService', data: { method: 'replaceState' } }],
    },
    {
      name: 'window.history.pushState call',
      code: `window.history.pushState(null, '', '/dashboard')`,
      errors: [{ messageId: 'preferLocationService', data: { method: 'pushState' } }],
    },
    {
      name: 'window.history.replaceState call',
      code: `window.history.replaceState(null, '', '/settings')`,
      errors: [{ messageId: 'preferLocationService', data: { method: 'replaceState' } }],
    },
    {
      name: 'history.pushState inside a function body',
      code: `
        function navigate(url) {
          history.pushState(null, '', url)
        }
      `,
      errors: [{ messageId: 'preferLocationService', data: { method: 'pushState' } }],
    },
    {
      name: 'history.pushState in non-test file without allowedPathPatterns',
      filename: 'src/services/navigate-to-route.ts',
      code: `history.pushState(null, '', '/dashboard')`,
      errors: [{ messageId: 'preferLocationService', data: { method: 'pushState' } }],
    },
  ],
})
