module.exports = {
  extends: ['eslint:recommended', 'prettier', 'prettier/@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'cypress'],
  env: { browser: true, node: true, es6: true, jest: true, 'cypress/globals': true },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {},
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'no-unused-vars': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-unused-vars': 'off', // Use Typescript own check for this
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    'prettier/prettier': 'error',
  },
}
