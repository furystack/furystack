import type { TSESLint } from '@typescript-eslint/utils'

export const recommended: TSESLint.FlatConfig.Config = {
  rules: {
    'furystack/no-direct-physical-store': 'error',
    'furystack/require-disposable-for-observable-owner': 'error',
    'furystack/require-observable-disposal': 'warn',
    'furystack/prefer-using-wrapper': 'warn',
  },
}
