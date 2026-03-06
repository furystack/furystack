import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getEnclosingRenderFunction } from '../utils/shade-ast.js'

/** Suggests `<NestedRouteLink>` over `<a href="/...">` for in-app navigation inside Shade components. */
export const preferNestedRouteLink = createRule({
  name: 'prefer-nested-route-link',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer <NestedRouteLink> over raw <a href="/..."> for in-app navigation inside Shade components. Raw anchor tags bypass SPA routing and cause full page reloads.',
    },
    messages: {
      preferNestedRouteLink:
        'Use <NestedRouteLink href="..."> instead of <a href="..."> for in-app navigation. Raw <a> tags bypass SPA routing and cause full page reloads.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== AST_NODE_TYPES.JSXIdentifier || node.name.name !== 'a') return

        const hrefAttr = node.attributes.find(
          (attr): attr is TSESTree.JSXAttribute =>
            attr.type === AST_NODE_TYPES.JSXAttribute &&
            attr.name.type === AST_NODE_TYPES.JSXIdentifier &&
            attr.name.name === 'href',
        )

        if (
          !hrefAttr?.value ||
          hrefAttr.value.type !== AST_NODE_TYPES.Literal ||
          typeof hrefAttr.value.value !== 'string' ||
          !hrefAttr.value.value.startsWith('/')
        ) {
          return
        }

        const hasTargetBlank = node.attributes.some(
          (attr) =>
            attr.type === AST_NODE_TYPES.JSXAttribute &&
            attr.name.type === AST_NODE_TYPES.JSXIdentifier &&
            attr.name.name === 'target' &&
            attr.value?.type === AST_NODE_TYPES.Literal &&
            attr.value.value === '_blank',
        )

        if (hasTargetBlank) return

        if (!getEnclosingRenderFunction(node)) return

        context.report({ node, messageId: 'preferNestedRouteLink' })
      },
    }
  },
})
