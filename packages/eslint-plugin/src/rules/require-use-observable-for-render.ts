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

const isUseDisposableWithObservable = (node: TSESTree.CallExpression): boolean => {
  if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'useDisposable') return false
  if (node.arguments.length < 2) return false

  const factoryArg = node.arguments[1]
  if (
    factoryArg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    factoryArg.type !== AST_NODE_TYPES.FunctionExpression
  ) {
    return false
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

  return (
    returnExpr?.type === AST_NODE_TYPES.NewExpression &&
    returnExpr.callee.type === AST_NODE_TYPES.Identifier &&
    returnExpr.callee.name === 'ObservableValue'
  )
}

const getEnclosingRenderFunction = (node: TSESTree.Node): TSESTree.Node | null => {
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

export const requireUseObservableForRender = createRule({
  name: 'require-use-observable-for-render',
  meta: {
    type: 'problem',
    docs: {
      description:
        'When useDisposable creates an ObservableValue inside a Shade render function, it must be paired with useObservable to trigger re-renders. Using .getValue() without useObservable means the component will not update when the value changes.',
    },
    messages: {
      missingUseObservable:
        'ObservableValue created via useDisposable("{{ key }}") is used with .getValue() but has no corresponding useObservable("{{ key }}", ...) call. The component will not re-render when this value changes.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const observableDisposables = new Map<
      string,
      { variableName: string | null; node: TSESTree.CallExpression; renderScope: TSESTree.Node }
    >()
    const useObservableKeys = new Map<string, TSESTree.Node>()
    const getValueUsages: Array<{ variableName: string; node: TSESTree.Node; renderScope: TSESTree.Node }> = []

    return {
      CallExpression(node) {
        const renderScope = getEnclosingRenderFunction(node)
        if (!renderScope) return

        if (isUseDisposableWithObservable(node)) {
          const keyArg = node.arguments[0]
          if (keyArg.type === AST_NODE_TYPES.Literal && typeof keyArg.value === 'string') {
            let variableName: string | null = null
            if (
              node.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
              node.parent.id.type === AST_NODE_TYPES.Identifier
            ) {
              variableName = node.parent.id.name
            }
            observableDisposables.set(keyArg.value, { variableName, node, renderScope })
          }
          return
        }

        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'useObservable' &&
          node.arguments.length >= 2
        ) {
          const keyArg = node.arguments[0]
          if (keyArg.type === AST_NODE_TYPES.Literal && typeof keyArg.value === 'string') {
            useObservableKeys.set(keyArg.value, renderScope)
          }
        }
      },

      MemberExpression(node) {
        if (node.property.type !== AST_NODE_TYPES.Identifier || node.property.name !== 'getValue') return
        if (node.object.type !== AST_NODE_TYPES.Identifier) return

        const renderScope = getEnclosingRenderFunction(node)
        if (!renderScope) return

        getValueUsages.push({ variableName: node.object.name, node, renderScope })
      },

      'Program:exit'() {
        for (const [key, entry] of observableDisposables) {
          if (useObservableKeys.has(key)) continue

          const hasGetValueCall = getValueUsages.some(
            (usage) => usage.variableName === entry.variableName && usage.renderScope === entry.renderScope,
          )

          if (hasGetValueCall) {
            context.report({
              node: entry.node,
              messageId: 'missingUseObservable',
              data: { key },
            })
          }
        }
      },
    }
  },
})
