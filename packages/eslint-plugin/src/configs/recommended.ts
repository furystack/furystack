import type { Linter } from 'eslint'

export const recommended: Linter.Config = {
  rules: {
    'furystack/no-direct-physical-store': 'error',
    'furystack/require-disposable-for-observable-owner': 'error',
    'furystack/require-observable-disposal': 'warn',
    'furystack/prefer-using-wrapper': 'warn',
    'furystack/injectable-consistent-inject': 'warn',
    'furystack/rest-action-use-request-error': 'warn',
    'furystack/rest-action-validate-wrapper': 'warn',
  },
}

export const recommendedStrict: Linter.Config = {
  rules: {
    'furystack/no-direct-physical-store': 'error',
    'furystack/require-disposable-for-observable-owner': 'error',
    'furystack/require-observable-disposal': 'error',
    'furystack/prefer-using-wrapper': 'error',
    'furystack/injectable-consistent-inject': 'error',
    'furystack/rest-action-use-request-error': 'error',
    'furystack/rest-action-validate-wrapper': 'error',
    'furystack/rest-no-type-cast': 'error',
  },
}
