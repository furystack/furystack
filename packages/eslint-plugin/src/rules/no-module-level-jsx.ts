import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

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
    const reported = new WeakSet<TSESTree.VariableDeclarator>()

    return {
      'JSXElement, JSXFragment'(node: TSESTree.Node) {
        let current: TSESTree.Node | undefined = node.parent
        while (current) {
          if (
            current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            current.type === AST_NODE_TYPES.FunctionExpression ||
            current.type === AST_NODE_TYPES.FunctionDeclaration
          ) {
            return
          }

          if (
            current.type === AST_NODE_TYPES.VariableDeclarator &&
            current.parent.parent?.type === AST_NODE_TYPES.Program
          ) {
            if (!reported.has(current)) {
              reported.add(current)
              context.report({ node: current, messageId: 'noModuleLevelJsx' })
            }
            return
          }

          current = current.parent
        }
      },
    }
  },
})
