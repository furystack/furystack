import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getEnclosingRenderFunction } from '../utils/shade-ast.js'

const NATIVELY_FOCUSABLE_TAGS = new Set(['button', 'input', 'select', 'textarea', 'a'])

const SPATIAL_NAV_ATTR = 'data-spatial-nav-target'

const hasPropertyKey = (props: TSESTree.ObjectExpression['properties'], key: string): boolean =>
  props.some(
    (p) =>
      p.type === AST_NODE_TYPES.Property &&
      ((p.key.type === AST_NODE_TYPES.Identifier && p.key.name === key) ||
        (p.key.type === AST_NODE_TYPES.Literal && p.key.value === key)),
  )

const hasPropertyInObject = (obj: TSESTree.ObjectExpression, key: string): boolean => {
  for (const prop of obj.properties) {
    if (
      prop.type === AST_NODE_TYPES.Property &&
      ((prop.key.type === AST_NODE_TYPES.Identifier && prop.key.name === key) ||
        (prop.key.type === AST_NODE_TYPES.Literal && prop.key.value === key))
    ) {
      return true
    }
    if (prop.type === AST_NODE_TYPES.SpreadElement) {
      const inner = unwrapSpreadObject(prop)
      if (inner && hasPropertyKey(inner.properties, key)) return true
    }
  }
  return false
}

/**
 * Unwraps common spread patterns to get the inner object expression.
 * Handles: `...obj`, `...(cond ? { ... } : {})`, `...(cond && { ... })`
 */
const unwrapSpreadObject = (spread: TSESTree.SpreadElement): TSESTree.ObjectExpression | null => {
  const arg = spread.argument
  if (arg.type === AST_NODE_TYPES.ObjectExpression) return arg
  if (arg.type === AST_NODE_TYPES.ConditionalExpression) {
    if (arg.consequent.type === AST_NODE_TYPES.ObjectExpression) return arg.consequent
    if (arg.alternate.type === AST_NODE_TYPES.ObjectExpression) return arg.alternate
  }
  if (arg.type === AST_NODE_TYPES.LogicalExpression && arg.operator === '&&') {
    if (arg.right.type === AST_NODE_TYPES.ObjectExpression) return arg.right
  }
  return null
}

/**
 * Ensures elements with `data-spatial-nav-target` also have `tabIndex` set.
 * Without `tabIndex`, custom elements cannot be focused by `SpatialNavigationService`.
 */
export const requireTabindexWithSpatialNavTarget = createRule({
  name: 'require-tabindex-with-spatial-nav-target',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Elements with data-spatial-nav-target must also have tabIndex set to be keyboard-focusable by SpatialNavigationService.',
    },
    messages: {
      missingTabIndex: 'Elements with data-spatial-nav-target must also have tabIndex set to be keyboard-focusable.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'useHostProps') return
        if (!getEnclosingRenderFunction(node)) return
        if (node.arguments.length === 0 || node.arguments[0].type !== AST_NODE_TYPES.ObjectExpression) return

        const obj = node.arguments[0]
        if (!hasPropertyInObject(obj, SPATIAL_NAV_ATTR)) return
        if (hasPropertyInObject(obj, 'tabIndex') || hasPropertyInObject(obj, 'tabindex')) return

        context.report({ node, messageId: 'missingTabIndex' })
      },

      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        if (!getEnclosingRenderFunction(node)) return

        const hasSpatialAttr = node.attributes.some(
          (attr) => attr.type === AST_NODE_TYPES.JSXAttribute && attr.name.name === SPATIAL_NAV_ATTR,
        )
        if (!hasSpatialAttr) return

        if (node.name.type === AST_NODE_TYPES.JSXIdentifier && NATIVELY_FOCUSABLE_TAGS.has(node.name.name)) {
          return
        }

        const hasTabIndex = node.attributes.some(
          (attr) =>
            attr.type === AST_NODE_TYPES.JSXAttribute &&
            (attr.name.name === 'tabIndex' || attr.name.name === 'tabindex'),
        )
        if (hasTabIndex) return

        context.report({ node, messageId: 'missingTabIndex' })
      },
    }
  },
})
