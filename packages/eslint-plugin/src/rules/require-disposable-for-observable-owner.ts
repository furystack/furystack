import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const isSymbolDisposeKey = (key: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean => {
  if (key.type !== AST_NODE_TYPES.MemberExpression) return false
  return (
    key.object.type === AST_NODE_TYPES.Identifier &&
    key.object.name === 'Symbol' &&
    key.property.type === AST_NODE_TYPES.Identifier &&
    (key.property.name === 'dispose' || key.property.name === 'asyncDispose')
  )
}

const hasObservableValueAssignment = (body: TSESTree.ClassBody): boolean => {
  return body.body.some((member) => {
    if (member.type === AST_NODE_TYPES.PropertyDefinition && member.value) {
      return isNewObservableValue(member.value)
    }
    return false
  })
}

const isNewObservableValue = (node: TSESTree.Expression): boolean => {
  return (
    node.type === AST_NODE_TYPES.NewExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'ObservableValue'
  )
}

const hasDisposeMethod = (body: TSESTree.ClassBody): boolean => {
  return body.body.some((member) => {
    if (member.type !== AST_NODE_TYPES.MethodDefinition) return false
    return member.computed && isSymbolDisposeKey(member.key)
  })
}

export const requireDisposableForObservableOwner = createRule({
  name: 'require-disposable-for-observable-owner',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Classes that own ObservableValue instances must implement Disposable by providing a [Symbol.dispose]() or [Symbol.asyncDispose]() method.',
    },
    messages: {
      missingDisposable:
        'Class "{{ className }}" owns ObservableValue instances but does not implement Disposable. Add [Symbol.dispose]() to clean up observable subscriptions.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!hasObservableValueAssignment(node.body)) return
        if (hasDisposeMethod(node.body)) return

        context.report({
          node: node.id ?? node,
          messageId: 'missingDisposable',
          data: { className: node.id?.name ?? '<anonymous>' },
        })
      },
      ClassExpression(node) {
        if (!hasObservableValueAssignment(node.body)) return
        if (hasDisposeMethod(node.body)) return

        context.report({
          node: node.id ?? node,
          messageId: 'missingDisposable',
          data: { className: node.id?.name ?? '<anonymous>' },
        })
      },
    }
  },
})
