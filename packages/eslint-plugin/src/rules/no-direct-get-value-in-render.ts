import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getEnclosingRenderFunction } from '../utils/shade-ast.js'
import { getTypeServices, isDefinitelyNotType } from '../utils/type-services.js'

/**
 * Checks if the node is inside a nested callback (event handler, prop callback, etc.)
 * between it and the return statement. Calls inside callbacks like onclick, onkeyup,
 * getValidationResult etc. execute at event/call time, not at render time, so reading
 * .getValue() there is fine.
 */
const isInsideNestedCallback = (
  node: TSESTree.Node,
  renderFn: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): boolean => {
  let current: TSESTree.Node | undefined = node.parent
  while (current && current !== renderFn) {
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return true
    }
    current = current.parent
  }
  return false
}

const isInsideReturnExpression = (
  node: TSESTree.Node,
  renderFn: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): boolean => {
  if (renderFn.type === AST_NODE_TYPES.ArrowFunctionExpression && renderFn.body.type !== AST_NODE_TYPES.BlockStatement)
    return true

  let current: TSESTree.Node | undefined = node.parent
  while (current && current !== renderFn) {
    if (current.type === AST_NODE_TYPES.ReturnStatement) return true
    current = current.parent
  }
  return false
}

export const noDirectGetValueInRender = createRule({
  name: 'no-direct-get-value-in-render',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when .getValue() is called inside a Shade render return expression without a corresponding useObservable subscription. This usually means the component will not re-render when the underlying ObservableValue changes.',
    },
    messages: {
      noDirectGetValue:
        'Calling .getValue() in Shade render output without useObservable means the component will not re-render when this value changes. Subscribe via useObservable() and use the returned value instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const typeServices = getTypeServices(context)

    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier || node.callee.property.name !== 'getValue') return

        const renderFn = getEnclosingRenderFunction(node)
        if (!renderFn) return

        if (!isInsideReturnExpression(node, renderFn)) return

        // .getValue() inside event handlers (onclick, onkeyup, etc.) and callback props
        // executes at event/call time, not render time -- this is fine
        if (isInsideNestedCallback(node, renderFn)) return

        if (typeServices && isDefinitelyNotType(typeServices, node.callee.object, ['ObservableValue'])) return

        context.report({ node, messageId: 'noDirectGetValue' })
      },
    }
  },
})
