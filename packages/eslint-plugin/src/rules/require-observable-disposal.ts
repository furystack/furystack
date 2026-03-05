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

const getObservableFieldNames = (body: TSESTree.ClassBody): string[] => {
  const names: string[] = []
  for (const member of body.body) {
    if (
      member.type === AST_NODE_TYPES.PropertyDefinition &&
      member.value &&
      member.value.type === AST_NODE_TYPES.NewExpression &&
      member.value.callee.type === AST_NODE_TYPES.Identifier &&
      member.value.callee.name === 'ObservableValue'
    ) {
      if (member.key.type === AST_NODE_TYPES.Identifier) {
        names.push(member.key.name)
      }
    }
  }
  return names
}

const getDisposeMethodBody = (body: TSESTree.ClassBody): TSESTree.BlockStatement | null => {
  for (const member of body.body) {
    if (member.type === AST_NODE_TYPES.MethodDefinition && member.computed && isSymbolDisposeKey(member.key)) {
      return member.value.body ?? null
    }
  }
  return null
}

const collectDisposedFieldNames = (disposeBody: TSESTree.BlockStatement): Set<string> => {
  const disposed = new Set<string>()

  const visit = (node: TSESTree.Node): void => {
    if (
      node.type === AST_NODE_TYPES.CallExpression &&
      node.callee.type === AST_NODE_TYPES.MemberExpression &&
      node.callee.property.type === AST_NODE_TYPES.MemberExpression &&
      node.callee.property.object.type === AST_NODE_TYPES.Identifier &&
      node.callee.property.object.name === 'Symbol' &&
      node.callee.property.property.type === AST_NODE_TYPES.Identifier &&
      node.callee.property.property.name === 'dispose'
    ) {
      const obj = node.callee.object
      if (obj.type === AST_NODE_TYPES.MemberExpression && obj.property.type === AST_NODE_TYPES.Identifier) {
        disposed.add(obj.property.name)
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'parent') continue
      const child = (node as unknown as Record<string, unknown>)[key]
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              visit(item as TSESTree.Node)
            }
          }
        } else if ('type' in child) {
          visit(child as TSESTree.Node)
        }
      }
    }
  }

  visit(disposeBody)
  return disposed
}

export const requireObservableDisposal = createRule({
  name: 'require-observable-disposal',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Each ObservableValue field in a class must be disposed in the [Symbol.dispose]() method to prevent memory leaks.',
    },
    messages: {
      undisposedObservable:
        'ObservableValue field "{{ fieldName }}" is not disposed in [Symbol.dispose](). Call this.{{ fieldName }}[Symbol.dispose]() to prevent memory leaks.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checkClass = (node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) => {
      const observableFields = getObservableFieldNames(node.body)
      if (observableFields.length === 0) return

      const disposeBody = getDisposeMethodBody(node.body)
      if (!disposeBody) return

      const disposedFields = collectDisposedFieldNames(disposeBody)

      for (const fieldName of observableFields) {
        if (!disposedFields.has(fieldName)) {
          const member = node.body.body.find(
            (m): m is TSESTree.PropertyDefinition =>
              m.type === AST_NODE_TYPES.PropertyDefinition &&
              m.key.type === AST_NODE_TYPES.Identifier &&
              m.key.name === fieldName,
          )
          if (member) {
            context.report({
              node: member.key,
              messageId: 'undisposedObservable',
              data: { fieldName },
            })
          }
        }
      }
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    }
  },
})
