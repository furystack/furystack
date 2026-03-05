import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

export const validShadowDomName = createRule({
  name: 'valid-shadow-dom-name',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Validate the shadowDomName string in Shade() calls. Custom element names must be lowercase, contain a hyphen, and not start with a digit or hyphen.',
    },
    messages: {
      missingHyphen: 'shadowDomName "{{ name }}" must contain at least one hyphen (Custom Elements spec requirement).',
      notLowercase: 'shadowDomName "{{ name }}" must be all lowercase.',
      invalidStart: 'shadowDomName "{{ name }}" must not start with a digit or hyphen.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'Shade') return
        if (node.arguments.length === 0) return

        const arg = node.arguments[0]
        if (arg.type !== AST_NODE_TYPES.ObjectExpression) return

        for (const prop of arg.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue
          if (prop.key.type !== AST_NODE_TYPES.Identifier || prop.key.name !== 'shadowDomName') continue

          if (prop.value.type !== AST_NODE_TYPES.Literal || typeof prop.value.value !== 'string') continue

          const name = prop.value.value

          if (!name.includes('-')) {
            context.report({ node: prop.value, messageId: 'missingHyphen', data: { name } })
          }
          if (name !== name.toLowerCase()) {
            context.report({ node: prop.value, messageId: 'notLowercase', data: { name } })
          }
          if (/^[\d-]/.test(name)) {
            context.report({ node: prop.value, messageId: 'invalidStart', data: { name } })
          }
        }
      },
    }
  },
})
