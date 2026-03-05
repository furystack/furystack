import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const CSS_STATE_PATTERNS = [/^(is)?hover(ed)?$/i, /^(is)?focus(ed)?$/i, /^(is)?active$/i, /^(is)?press(ed)?$/i]

const matchesCssStatePattern = (key: string): string | null => {
  for (const pattern of CSS_STATE_PATTERNS) {
    if (pattern.test(key)) return key
  }
  return null
}

export const noCssStateHooks = createRule({
  name: 'no-css-state-hooks',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Avoid using useState for CSS-representable states like hover, focus, and active. Use CSS pseudo-selectors in the css property instead.',
    },
    messages: {
      noCssStateHook:
        'Use CSS pseudo-selectors in the "css" property instead of JavaScript state for "{{ stateName }}". Pseudo-selectors like &:hover, &:focus, &:active are more performant and don\'t require re-renders.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'useState') return
        if (node.arguments.length === 0) return

        const keyArg = node.arguments[0]
        if (keyArg.type !== AST_NODE_TYPES.Literal || typeof keyArg.value !== 'string') return

        const stateName = matchesCssStatePattern(keyArg.value)
        if (stateName) {
          context.report({ node, messageId: 'noCssStateHook', data: { stateName } })
        }
      },
    }
  },
})
