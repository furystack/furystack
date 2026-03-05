import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const isSymbolDisposeCall = (node: TSESTree.CallExpression): { objectName: string; isAsync: boolean } | null => {
  const { callee } = node
  if (callee.type !== AST_NODE_TYPES.MemberExpression || !callee.computed) return null
  if (callee.property.type !== AST_NODE_TYPES.MemberExpression) return null

  const sym = callee.property
  if (
    sym.object.type !== AST_NODE_TYPES.Identifier ||
    sym.object.name !== 'Symbol' ||
    sym.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return null
  }

  const isAsync = sym.property.name === 'asyncDispose'
  if (sym.property.name !== 'dispose' && !isAsync) return null

  const obj = callee.object
  if (obj.type !== AST_NODE_TYPES.Identifier) return null

  return { objectName: obj.name, isAsync }
}

const getEnclosingFunction = (
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

const isInsideFinallyBlock = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      current.type === AST_NODE_TYPES.BlockStatement &&
      current.parent?.type === AST_NODE_TYPES.TryStatement &&
      current.parent.finalizer === current
    ) {
      return true
    }
    current = current.parent
  }
  return false
}

const isInsideUsingCallback = (node: TSESTree.Node): boolean => {
  const fn = getEnclosingFunction(node)
  if (!fn || !fn.parent) return false

  if (fn.parent.type === AST_NODE_TYPES.CallExpression) {
    const { callee } = fn.parent
    if (callee.type === AST_NODE_TYPES.Identifier) {
      return callee.name === 'using' || callee.name === 'usingAsync'
    }
  }
  return false
}

const isFollowedByExpect = (node: TSESTree.CallExpression): boolean => {
  let current: TSESTree.Node | undefined = node.parent
  while (current && current.type === AST_NODE_TYPES.AwaitExpression) {
    current = current.parent
  }
  if (!current || current.type !== AST_NODE_TYPES.ExpressionStatement) return false

  const container = current.parent
  if (!container || !('body' in container) || !Array.isArray(container.body)) return false

  const statements = container.body as TSESTree.Statement[]
  const idx = statements.indexOf(current as TSESTree.Statement)
  if (idx === -1 || idx >= statements.length - 1) return false

  const next = statements[idx + 1]
  if (next.type === AST_NODE_TYPES.ExpressionStatement) {
    const expr = next.expression
    if (
      expr.type === AST_NODE_TYPES.CallExpression &&
      expr.callee.type === AST_NODE_TYPES.Identifier &&
      expr.callee.name === 'expect'
    ) {
      return true
    }
    if (
      expr.type === AST_NODE_TYPES.CallExpression &&
      expr.callee.type === AST_NODE_TYPES.MemberExpression &&
      expr.callee.object.type === AST_NODE_TYPES.CallExpression &&
      expr.callee.object.callee.type === AST_NODE_TYPES.Identifier &&
      expr.callee.object.callee.name === 'expect'
    ) {
      return true
    }
  }
  return false
}

export const preferUsingWrapper = createRule({
  name: 'prefer-using-wrapper',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer using() or usingAsync() wrappers over manual create-and-dispose in the same scope to ensure disposal even if an exception is thrown.',
    },
    messages: {
      preferUsing:
        'Disposable "{{ varName }}" is created and disposed in the same scope. Use using({{ varName }}, ...) to ensure disposal even if an exception is thrown.',
      preferUsingAsync:
        'Disposable "{{ varName }}" is created and disposed in the same scope. Use usingAsync({{ varName }}, ...) to ensure disposal even if an exception is thrown.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const info = isSymbolDisposeCall(node)
        if (!info) return

        if (isInsideUsingCallback(node)) return
        if (isInsideFinallyBlock(node)) return
        if (isFollowedByExpect(node)) return

        const enclosing = getEnclosingFunction(node)
        if (!enclosing) return

        const scope = context.sourceCode.getScope(node)
        let currentScope: typeof scope | null = scope
        while (currentScope) {
          const variable = currentScope.variables.find((v) => v.name === info.objectName)
          if (variable) {
            const def = variable.defs[0]
            if (
              def?.type === TSESLint.Scope.DefinitionType.Variable &&
              def.node.init?.type === AST_NODE_TYPES.NewExpression
            ) {
              context.report({
                node,
                messageId: info.isAsync ? 'preferUsingAsync' : 'preferUsing',
                data: { varName: info.objectName },
              })
            }
            break
          }
          currentScope = currentScope.upper
        }
      },
    }
  },
})
