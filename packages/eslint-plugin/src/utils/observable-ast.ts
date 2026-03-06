import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree, ParserServicesWithTypeInformation } from '@typescript-eslint/utils'
import { matchesType } from './type-services.js'

/**
 * Detects `useDisposable("key", () => new ObservableValue(...))` calls.
 * Returns the string key if matched, or `null` otherwise.
 *
 * When `typeServices` is provided, also matches aliased constructors
 * that resolve to `ObservableValue` at the type level.
 */
export const isUseDisposableWithObservable = (
  node: TSESTree.CallExpression,
  typeServices?: ParserServicesWithTypeInformation | null,
): string | null => {
  if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'useDisposable') return null
  if (node.arguments.length < 2) return null

  const keyArg = node.arguments[0]
  if (keyArg.type !== AST_NODE_TYPES.Literal || typeof keyArg.value !== 'string') return null

  const factoryArg = node.arguments[1]
  if (
    factoryArg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    factoryArg.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    return null
  }

  const { body } = factoryArg
  let returnExpr: TSESTree.Expression | null = null

  if (body.type === AST_NODE_TYPES.NewExpression) {
    returnExpr = body
  } else if (body.type === AST_NODE_TYPES.BlockStatement) {
    for (const stmt of body.body) {
      if (stmt.type === AST_NODE_TYPES.ReturnStatement && stmt.argument) {
        returnExpr = stmt.argument
        break
      }
    }
  }

  if (returnExpr?.type !== AST_NODE_TYPES.NewExpression) return null

  if (returnExpr.callee.type === AST_NODE_TYPES.Identifier && returnExpr.callee.name === 'ObservableValue') {
    return keyArg.value
  }

  if (typeServices && matchesType(typeServices, returnExpr, ['ObservableValue'])) {
    return keyArg.value
  }

  return null
}
