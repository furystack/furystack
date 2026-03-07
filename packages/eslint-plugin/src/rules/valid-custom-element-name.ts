import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

type Options = [{ requiredPrefix?: string }]

/** Validates `customElementName` in `Shade()` conforms to the Custom Elements spec. Provides auto-fix for casing. */
export const validCustomElementName = createRule<Options, string>({
  name: 'valid-custom-element-name',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Validate the customElementName string in Shade() calls. Custom element names must be lowercase, contain a hyphen, and not start with a digit or hyphen.',
    },
    fixable: 'code',
    messages: {
      missingHyphen:
        'customElementName "{{ name }}" must contain at least one hyphen (Custom Elements spec requirement).',
      notLowercase: 'customElementName "{{ name }}" must be all lowercase.',
      invalidStart: 'customElementName "{{ name }}" must not start with a digit or hyphen.',
      missingPrefix: 'customElementName "{{ name }}" must start with the prefix "{{ prefix }}".',
    },
    schema: [
      {
        type: 'object',
        properties: {
          requiredPrefix: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const { requiredPrefix } = options

    return {
      'CallExpression[callee.name="Shade"]'(node: TSESTree.CallExpression) {
        if (node.arguments.length === 0) return

        const arg = node.arguments[0]
        if (arg.type !== AST_NODE_TYPES.ObjectExpression) return

        for (const prop of arg.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue
          if (prop.key.type !== AST_NODE_TYPES.Identifier || prop.key.name !== 'customElementName') continue

          if (prop.value.type !== AST_NODE_TYPES.Literal || typeof prop.value.value !== 'string') continue

          const name = prop.value.value

          if (!name.includes('-')) {
            context.report({ node: prop.value, messageId: 'missingHyphen', data: { name } })
          }
          if (name !== name.toLowerCase()) {
            context.report({
              node: prop.value,
              messageId: 'notLowercase',
              data: { name },
              fix(fixer) {
                return fixer.replaceText(prop.value, `'${name.toLowerCase()}'`)
              },
            })
          }
          if (/^[\d-]/.test(name)) {
            context.report({ node: prop.value, messageId: 'invalidStart', data: { name } })
          }
          if (requiredPrefix && !name.startsWith(requiredPrefix)) {
            context.report({
              node: prop.value,
              messageId: 'missingPrefix',
              data: { name, prefix: requiredPrefix },
            })
          }
        }
      },
    }
  },
})
