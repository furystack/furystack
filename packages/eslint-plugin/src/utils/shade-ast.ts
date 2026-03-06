import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

/**
 * Checks whether a function node is the `render` property value inside a `Shade({ render: ... })` call.
 */
export const isShadeRenderFunction = (node: TSESTree.Node): boolean => {
  if (
    node.parent?.type !== AST_NODE_TYPES.Property ||
    node.parent.key.type !== AST_NODE_TYPES.Identifier ||
    node.parent.key.name !== 'render'
  ) {
    return false
  }

  const shadeArg = node.parent.parent
  if (shadeArg?.type !== AST_NODE_TYPES.ObjectExpression) return false

  const shadeCall = shadeArg.parent
  return (
    shadeCall?.type === AST_NODE_TYPES.CallExpression &&
    shadeCall.callee.type === AST_NODE_TYPES.Identifier &&
    shadeCall.callee.name === 'Shade'
  )
}

/**
 * Walks up the AST from `node` to find the nearest enclosing Shade render function.
 * Returns the function node, or `null` if `node` is not inside a Shade render.
 */
export const getEnclosingRenderFunction = (
  node: TSESTree.Node,
): TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | null => {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      (current.type === AST_NODE_TYPES.ArrowFunctionExpression || current.type === AST_NODE_TYPES.FunctionExpression) &&
      isShadeRenderFunction(current)
    ) {
      return current
    }
    current = current.parent
  }
  return null
}
