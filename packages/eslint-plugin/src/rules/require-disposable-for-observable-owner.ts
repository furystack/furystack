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

const getObservableFieldNames = (body: TSESTree.ClassBody): string[] => {
  const names: string[] = []
  for (const member of body.body) {
    if (
      member.type === AST_NODE_TYPES.PropertyDefinition &&
      member.value &&
      isNewObservableValue(member.value) &&
      member.key.type === AST_NODE_TYPES.Identifier
    ) {
      names.push(member.key.name)
    }
  }
  return names
}

const hasDisposeMethod = (body: TSESTree.ClassBody): boolean => {
  return body.body.some((member) => {
    if (member.type !== AST_NODE_TYPES.MethodDefinition) return false
    return member.computed && isSymbolDisposeKey(member.key)
  })
}

const getMemberIndent = (sourceCode: string, body: TSESTree.ClassBody): string => {
  for (const member of body.body) {
    const line = sourceCode.split('\n')[member.loc.start.line - 1]
    const match = line?.match(/^(\s*)/)
    if (match?.[1]) return match[1]
  }
  return '  '
}

export const requireDisposableForObservableOwner = createRule({
  name: 'require-disposable-for-observable-owner',
  meta: {
    type: 'problem',
    fixable: 'code',
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
    const checkClass = (node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) => {
      if (!hasObservableValueAssignment(node.body)) return
      if (hasDisposeMethod(node.body)) return

      const fieldNames = getObservableFieldNames(node.body)

      context.report({
        node: node.id ?? node,
        messageId: 'missingDisposable',
        data: { className: node.id?.name ?? '<anonymous>' },
        fix(fixer) {
          const memberIndent = getMemberIndent(context.sourceCode.getText(), node.body)
          const bodyIndent = `${memberIndent}  `
          const disposeCalls = fieldNames.map((name) => `${bodyIndent}this.${name}[Symbol.dispose]()`).join('\n')
          const method = `\n${memberIndent}public [Symbol.dispose]() {\n${disposeCalls}\n${memberIndent}}`

          const closingBrace = node.body.range[1] - 1
          return fixer.insertTextBeforeRange([closingBrace, closingBrace], `${method}\n`)
        },
      })
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    }
  },
})
