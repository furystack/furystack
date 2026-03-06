import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

export const noRemovedShadeApis = createRule({
  name: 'no-removed-shade-apis',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent usage of removed Shade APIs: onAttach, onDetach (use useDisposable), and element in render (use useHostProps/useRef).',
    },
    messages: {
      noOnAttach:
        '"onAttach" has been removed from Shade options. Use useDisposable() inside the render function for lifecycle management.',
      noOnDetach:
        '"onDetach" has been removed from Shade options. Use useDisposable() inside the render function for cleanup.',
      noElement:
        '"element" has been removed from render options. Use useHostProps() for host element attributes/styles and useRef() for child DOM access.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      'CallExpression[callee.name="Shade"]'(node: TSESTree.CallExpression) {
        if (node.arguments.length === 0) return

        const arg = node.arguments[0]
        if (arg.type !== AST_NODE_TYPES.ObjectExpression) return

        for (const prop of arg.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue
          if (prop.key.type !== AST_NODE_TYPES.Identifier) continue

          if (prop.key.name === 'onAttach') {
            context.report({ node: prop.key, messageId: 'noOnAttach' })
          }
          if (prop.key.name === 'onDetach') {
            context.report({ node: prop.key, messageId: 'noOnDetach' })
          }

          if (prop.key.name === 'render' && prop.value.type !== AST_NODE_TYPES.Identifier) {
            const renderFn =
              prop.value.type === AST_NODE_TYPES.ArrowFunctionExpression ||
              prop.value.type === AST_NODE_TYPES.FunctionExpression
                ? prop.value
                : null

            if (renderFn && renderFn.params.length > 0) {
              const param = renderFn.params[0]
              if (param.type === AST_NODE_TYPES.ObjectPattern) {
                for (const p of param.properties) {
                  if (
                    p.type === AST_NODE_TYPES.Property &&
                    p.key.type === AST_NODE_TYPES.Identifier &&
                    p.key.name === 'element'
                  ) {
                    context.report({ node: p.key, messageId: 'noElement' })
                  }
                }
              }
            }
          }
        }
      },
    }
  },
})
