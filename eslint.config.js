// @ts-check

import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import jsdoc from 'eslint-plugin-jsdoc'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ...playwright.configs['flat/recommended'],
    files: ['packages/shades-showcase-app/e2e'],
  },
  {
    ignores: [
      'coverage',
      'packages/*/node_modules/*',
      'packages/*/esm/*',
      'packages/*/types/*',
      'packages/*/dist/*',
      'packages/shades-showcase-app/bundle/*',
      '.yarn/*',
    ],
  },

  /// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  //...tseslint.configs.recommendedTypeChecked,
  /// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  prettierConfig,
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        project: [
          'tsconfig.eslint.json',
          //'packages/*/tsconfig.json'
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // Use Typescript own check for this
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'explicit',
            constructors: 'no-public',
            methods: 'explicit',
            properties: 'off',
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple', readonly: 'array-simple' }],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
      'object-shorthand': 'error',
      'dot-notation': 'error',
      'no-caller': 'error',
      'no-useless-concat': 'error',
      radix: 'error',
      yoda: 'error',
      'prefer-arrow-callback': 'error',
      'prefer-rest-params': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-spread': 'error',
      'no-shadow': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': ['error', { array: false, object: true }],
      'default-case': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/unbound-method': 'off', // vi.fn() is fine in tests
    },
  },
)
