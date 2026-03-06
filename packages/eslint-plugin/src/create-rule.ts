import { ESLintUtils } from '@typescript-eslint/utils'

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/furystack/furystack/blob/main/packages/eslint-plugin/src/rules/${name}.ts`,
)
