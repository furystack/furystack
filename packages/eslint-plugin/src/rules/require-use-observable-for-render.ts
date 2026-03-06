import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { isUseDisposableWithObservable } from '../utils/observable-ast.js'
import { getEnclosingRenderFunction } from '../utils/shade-ast.js'
import { getTypeServices } from '../utils/type-services.js'

/** Requires a matching `useObservable` when `useDisposable` creates an `ObservableValue` used via `.getValue()` in render. */
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
    const typeServices = getTypeServices(context)

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

        const key = isUseDisposableWithObservable(node, typeServices)
        if (key !== null) {
          let variableName: string | null = null
          if (
            node.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
            node.parent.id.type === AST_NODE_TYPES.Identifier
          ) {
            variableName = node.parent.id.name
          }
          observableDisposables.set(key, { variableName, node, renderScope })
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
