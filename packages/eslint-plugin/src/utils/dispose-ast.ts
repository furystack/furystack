import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

/**
 * Checks whether a computed property key is `[Symbol.dispose]` or `[Symbol.asyncDispose]`.
 */
export const isSymbolDisposeKey = (key: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean => {
  if (key.type !== AST_NODE_TYPES.MemberExpression) return false
  return (
    key.object.type === AST_NODE_TYPES.Identifier &&
    key.object.name === 'Symbol' &&
    key.property.type === AST_NODE_TYPES.Identifier &&
    (key.property.name === 'dispose' || key.property.name === 'asyncDispose')
  )
}

/**
 * Walks up the AST from `node` to find the nearest enclosing function (declaration, expression, or arrow).
 */
export const getEnclosingFunction = (
  node: TSESTree.Node,
): TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | null => {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      return current
    }
    current = current.parent
  }
  return null
}
