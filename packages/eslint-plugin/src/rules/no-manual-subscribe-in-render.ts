import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const isShadeRenderFunction = (node: TSESTree.Node): boolean => {
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

const isInsideNestedFunctionOrUseDisposable = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      // Direct useDisposable callback -- definitely safe
      if (
        current.parent?.type === AST_NODE_TYPES.CallExpression &&
        current.parent.callee.type === AST_NODE_TYPES.Identifier &&
        current.parent.callee.name === 'useDisposable'
      ) {
        return true
      }
      // Render function itself -- stop walking
      if (isShadeRenderFunction(current)) return false
      // Any other nested function (helper functions, etc.) -- likely manages
      // the subscription lifecycle via return value
      return true
    }
    current = current.parent
  }
  return false
}

const isInsideShadeRender = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      (current.type === AST_NODE_TYPES.ArrowFunctionExpression || current.type === AST_NODE_TYPES.FunctionExpression) &&
      isShadeRenderFunction(current)
    ) {
      return true
    }
    current = current.parent
  }
  return false
}

export const noManualSubscribeInRender = createRule({
  name: 'no-manual-subscribe-in-render',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling .subscribe() directly inside a Shade render function without wrapping it in useDisposable. Direct subscriptions will leak because they are never cleaned up on component disposal.',
    },
    messages: {
      noManualSubscribe:
        'Do not call .subscribe() directly in a Shade render function. Wrap it in useDisposable() to ensure the subscription is cleaned up when the component is disposed.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier || node.callee.property.name !== 'subscribe') return

        if (!isInsideShadeRender(node)) return
        if (isInsideNestedFunctionOrUseDisposable(node)) return

        context.report({ node, messageId: 'noManualSubscribe' })
      },
    }
  },
})
