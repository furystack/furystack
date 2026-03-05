import type { TSESLint } from '@typescript-eslint/utils'

export const shades: TSESLint.FlatConfig.Config = {
  rules: {
    'furystack/no-module-level-jsx': 'error',
    'furystack/no-removed-shade-apis': 'error',
    'furystack/valid-shadow-dom-name': 'error',
    'furystack/prefer-use-state': 'warn',
    'furystack/no-css-state-hooks': 'warn',
  },
}
