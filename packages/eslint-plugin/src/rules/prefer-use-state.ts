import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const isUseDisposableWithObservable = (node: TSESTree.CallExpression): string | null => {
  if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'useDisposable') return null
  if (node.arguments.length < 2) return null

  const keyArg = node.arguments[0]
  if (keyArg.type !== AST_NODE_TYPES.Literal || typeof keyArg.value !== 'string') return null

  const factoryArg = node.arguments[1]
  if (
    factoryArg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    factoryArg.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    return null
  }

  const { body } = factoryArg
  let returnExpr: TSESTree.Expression | null = null

  if (body.type === AST_NODE_TYPES.NewExpression) {
    returnExpr = body
  } else if (body.type === AST_NODE_TYPES.BlockStatement) {
    for (const stmt of body.body) {
      if (stmt.type === AST_NODE_TYPES.ReturnStatement && stmt.argument) {
        returnExpr = stmt.argument
        break
      }
    }
  }

  if (
    returnExpr?.type === AST_NODE_TYPES.NewExpression &&
    returnExpr.callee.type === AST_NODE_TYPES.Identifier &&
    returnExpr.callee.name === 'ObservableValue'
  ) {
    return keyArg.value
  }

  return null
}

export const preferUseState = createRule({
  name: 'prefer-use-state',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer useState() over manual useDisposable(ObservableValue) + useObservable for local component state.',
    },
    messages: {
      preferUseState:
        'Use useState("{{ key }}", initialValue) instead of manual useDisposable(ObservableValue) + useObservable for local component state.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const disposableKeys = new Map<string, { node: TSESTree.CallExpression; scope: TSESTree.Node | null }>()

    const getEnclosingFunction = (node: TSESTree.Node): TSESTree.Node | null => {
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

    return {
      CallExpression(node) {
        const key = isUseDisposableWithObservable(node)
        if (key) {
          disposableKeys.set(key, { node, scope: getEnclosingFunction(node) })
          return
        }

        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'useObservable' &&
          node.arguments.length >= 2
        ) {
          const keyArg = node.arguments[0]
          if (keyArg.type !== AST_NODE_TYPES.Literal || typeof keyArg.value !== 'string') return

          const entry = disposableKeys.get(keyArg.value)
          if (entry && entry.scope === getEnclosingFunction(node)) {
            context.report({
              node: entry.node,
              messageId: 'preferUseState',
              data: { key: keyArg.value },
            })
          }
        }
      },
    }
  },
})
