import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const containsJsx = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.JSXElement || node.type === AST_NODE_TYPES.JSXFragment) {
    return true
  }

  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression) {
    return false
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent') continue
    const child = (node as unknown as Record<string, unknown>)[key]
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item && containsJsx(item as TSESTree.Node)) {
            return true
          }
        }
      } else if ('type' in child && containsJsx(child as TSESTree.Node)) {
        return true
      }
    }
  }

  return false
}

export const noModuleLevelJsx = createRule({
  name: 'no-module-level-jsx',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent JSX stored in module-level variable declarations. JSX at module level creates shared VNode instances that cause duplication bugs on re-render. Use a factory function instead.',
    },
    messages: {
      noModuleLevelJsx:
        'JSX at module level creates shared VNode instances that cause duplication bugs on re-render. Use a factory function instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        if (node.parent.parent?.type !== AST_NODE_TYPES.Program) return
        if (!node.init) return

        if (
          node.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          node.init.type === AST_NODE_TYPES.FunctionExpression
        ) {
          return
        }

        if (containsJsx(node.init)) {
          context.report({ node, messageId: 'noModuleLevelJsx' })
        }
      },
    }
  },
})
