import type { TSESLint } from '@typescript-eslint/utils'

export const shades: TSESLint.FlatConfig.Config = {
  rules: {
    'furystack/no-module-level-jsx': 'error',
    'furystack/no-removed-shade-apis': 'error',
    'furystack/valid-shadow-dom-name': 'error',
    'furystack/prefer-use-state': 'warn',
    'furystack/no-css-state-hooks': 'warn',
    'furystack/require-use-observable-for-render': 'warn',
    'furystack/no-manual-subscribe-in-render': 'warn',
    'furystack/no-direct-get-value-in-render': 'warn',
    'furystack/prefer-location-service': 'warn',
    'furystack/prefer-nested-route-link': 'warn',
  },
}

export const shadesStrict: TSESLint.FlatConfig.Config = {
  rules: {
    'furystack/no-module-level-jsx': 'error',
    'furystack/no-removed-shade-apis': 'error',
    'furystack/valid-shadow-dom-name': 'error',
    'furystack/prefer-use-state': 'error',
    'furystack/no-css-state-hooks': 'error',
    'furystack/require-use-observable-for-render': 'error',
    'furystack/no-manual-subscribe-in-render': 'error',
    'furystack/no-direct-get-value-in-render': 'error',
    'furystack/prefer-location-service': 'error',
    'furystack/prefer-nested-route-link': 'error',
  },
}
