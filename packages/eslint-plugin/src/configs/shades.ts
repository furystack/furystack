import type { Linter } from 'eslint'

export const shades: Linter.Config = {
  rules: {
    'furystack/no-module-level-jsx': 'error',
    'furystack/no-removed-shade-apis': 'error',
    'furystack/valid-custom-element-name': 'error',
    'furystack/prefer-use-state': 'warn',
    'furystack/no-css-state-hooks': 'warn',
    'furystack/require-use-observable-for-render': 'warn',
    'furystack/no-manual-subscribe-in-render': 'warn',
    'furystack/no-direct-get-value-in-render': 'warn',
    'furystack/prefer-location-service': 'warn',
    'furystack/prefer-nested-route-link': 'warn',
    'furystack/require-tabindex-with-spatial-nav-target': 'warn',
  },
}

export const shadesStrict: Linter.Config = {
  rules: {
    'furystack/no-module-level-jsx': 'error',
    'furystack/no-removed-shade-apis': 'error',
    'furystack/valid-custom-element-name': 'error',
    'furystack/prefer-use-state': 'error',
    'furystack/no-css-state-hooks': 'error',
    'furystack/require-use-observable-for-render': 'error',
    'furystack/no-manual-subscribe-in-render': 'error',
    'furystack/no-direct-get-value-in-render': 'error',
    'furystack/prefer-location-service': 'error',
    'furystack/prefer-nested-route-link': 'error',
    'furystack/require-tabindex-with-spatial-nav-target': 'error',
  },
}
