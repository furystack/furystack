import type { TSESTree, ParserServicesWithTypeInformation } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { isSymbolDisposeKey } from '../utils/dispose-ast.js'
import { getTypeServices, matchesType } from '../utils/type-services.js'

const isObservableValueInstance = (
  node: TSESTree.Expression,
  typeServices: ParserServicesWithTypeInformation | null,
): boolean => {
  if (
    node.type === AST_NODE_TYPES.NewExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'ObservableValue'
  ) {
    return true
  }

  if (typeServices && node.type === AST_NODE_TYPES.NewExpression) {
    return matchesType(typeServices, node, ['ObservableValue'])
  }

  return false
}

const getObservableFieldNames = (
  body: TSESTree.ClassBody,
  typeServices: ParserServicesWithTypeInformation | null,
): string[] => {
  const names: string[] = []
  for (const member of body.body) {
    if (
      member.type === AST_NODE_TYPES.PropertyDefinition &&
      member.value &&
      isObservableValueInstance(member.value, typeServices) &&
      member.key.type === AST_NODE_TYPES.Identifier
    ) {
      names.push(member.key.name)
    }
  }
  return names
}

const getDisposeMethod = (
  body: TSESTree.ClassBody,
): (TSESTree.FunctionExpression | TSESTree.TSEmptyBodyFunctionExpression) | null => {
  for (const member of body.body) {
    if (member.type === AST_NODE_TYPES.MethodDefinition && member.computed && isSymbolDisposeKey(member.key)) {
      return member.value
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

const getBodyIndent = (lines: string[], disposeBody: TSESTree.BlockStatement): string => {
  for (const stmt of disposeBody.body) {
    const line = lines[stmt.loc.start.line - 1]
    const match = line?.match(/^(\s*)/)
    if (match?.[1]) return match[1]
  }
  const closingLine = lines[disposeBody.loc.end.line - 1]
  const closingMatch = closingLine?.match(/^(\s*)/)
  return `${closingMatch?.[1] ?? ''}  `
}

/** Ensures every `ObservableValue` field is disposed in `[Symbol.dispose]()`. Provides auto-fix. */
export const requireObservableDisposal = createRule({
  name: 'require-observable-disposal',
  meta: {
    type: 'suggestion',
    fixable: 'code',
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
    const typeServices = getTypeServices(context)

    const checkClass = (node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) => {
      const observableFields = getObservableFieldNames(node.body, typeServices)
      if (observableFields.length === 0) return

      const disposeMethod = getDisposeMethod(node.body)
      if (!disposeMethod?.body) return

      const disposedFields = collectDisposedFieldNames(disposeMethod.body)

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
              fix(fixer) {
                const { body: disposeBody } = disposeMethod
                if (!disposeBody) return null

                const lines = context.sourceCode.getText().split('\n')
                const indent = getBodyIndent(lines, disposeBody)

                const lastStmt = disposeBody.body[disposeBody.body.length - 1]
                if (lastStmt) {
                  return fixer.insertTextAfter(lastStmt, `\n${indent}this.${fieldName}[Symbol.dispose]()`)
                }
                const insertPos = disposeBody.range[1] - 1
                return fixer.insertTextBeforeRange(
                  [insertPos, insertPos],
                  `${indent}this.${fieldName}[Symbol.dispose]()\n`,
                )
              },
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
