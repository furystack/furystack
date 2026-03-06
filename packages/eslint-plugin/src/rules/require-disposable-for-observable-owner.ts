import type { TSESTree, ParserServicesWithTypeInformation } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { isSymbolDisposeKey } from '../utils/dispose-ast.js'
import { getTypeServices, matchesType } from '../utils/type-services.js'

const DISPOSABLE_CONSTRUCTORS = ['ObservableValue', 'Cache']

const isNewDisposableInstance = (
  node: TSESTree.Expression,
  typeServices: ParserServicesWithTypeInformation | null,
): boolean => {
  if (node.type !== AST_NODE_TYPES.NewExpression) return false

  if (node.callee.type === AST_NODE_TYPES.Identifier && DISPOSABLE_CONSTRUCTORS.includes(node.callee.name)) {
    return true
  }

  if (typeServices) {
    return matchesType(typeServices, node, DISPOSABLE_CONSTRUCTORS)
  }

  return false
}

const hasSubscribeCall = (node: TSESTree.Expression): boolean => {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'subscribe'
  )
}

const hasDisposableResource = (
  body: TSESTree.ClassBody,
  typeServices: ParserServicesWithTypeInformation | null,
): boolean => {
  return body.body.some((member) => {
    if (member.type !== AST_NODE_TYPES.PropertyDefinition || !member.value) return false
    return isNewDisposableInstance(member.value, typeServices) || hasSubscribeCall(member.value)
  })
}

const getDisposableFieldNames = (
  body: TSESTree.ClassBody,
  typeServices: ParserServicesWithTypeInformation | null,
): string[] => {
  const names: string[] = []
  for (const member of body.body) {
    if (
      member.type === AST_NODE_TYPES.PropertyDefinition &&
      member.value &&
      isNewDisposableInstance(member.value, typeServices) &&
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

/** Requires classes owning disposable resources to implement `[Symbol.dispose]()`. Provides auto-fix. */
export const requireDisposableForObservableOwner = createRule({
  name: 'require-disposable-for-observable-owner',
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Classes that own disposable resources (ObservableValue, Cache, or subscriptions) must implement Disposable by providing a [Symbol.dispose]() or [Symbol.asyncDispose]() method.',
    },
    messages: {
      missingDisposable:
        'Class "{{ className }}" owns disposable resources but does not implement Disposable. Add [Symbol.dispose]() to clean them up.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const typeServices = getTypeServices(context)

    const checkClass = (node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) => {
      if (!hasDisposableResource(node.body, typeServices)) return
      if (hasDisposeMethod(node.body)) return

      const fieldNames = getDisposableFieldNames(node.body, typeServices)

      context.report({
        node: node.id ?? node,
        messageId: 'missingDisposable',
        data: { className: node.id?.name ?? '<anonymous>' },
        fix(fixer) {
          if (fieldNames.length === 0) return null

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
