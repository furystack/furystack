import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getEnclosingFunction } from '../utils/dispose-ast.js'
import { isUseDisposableWithObservable } from '../utils/observable-ast.js'
import { getTypeServices } from '../utils/type-services.js'

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
    const typeServices = getTypeServices(context)
    const disposableKeys = new Map<string, { node: TSESTree.CallExpression; scope: TSESTree.Node | null }>()

    return {
      CallExpression(node) {
        const key = isUseDisposableWithObservable(node, typeServices)
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
