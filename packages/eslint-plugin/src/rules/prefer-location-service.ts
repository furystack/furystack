import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const DEFAULT_ALLOWED_PATH_PATTERNS = [/\.spec\.tsx?$/]

type Options = [{ allowedPathPatterns?: string[] }]

const isHistoryObject = (node: TSESTree.Expression): boolean => {
  if (node.type === AST_NODE_TYPES.Identifier && node.name === 'history') return true

  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === 'window' &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === 'history'
  )
}

export const preferLocationService = createRule<Options, 'preferLocationService'>({
  name: 'prefer-location-service',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Avoid direct history.pushState/replaceState calls. Use LocationService.navigate() or NestedRouteLink for SPA navigation to ensure routing state stays in sync.',
    },
    messages: {
      preferLocationService:
        'Avoid direct history.{{ method }}() calls. Use LocationService.navigate() or NestedRouteLink for SPA navigation to ensure routing state stays in sync.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPathPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const filename = context.filename ?? context.getFilename()

    const userPatterns = (options.allowedPathPatterns ?? []).map((p) => new RegExp(p))
    const allPatterns = [...DEFAULT_ALLOWED_PATH_PATTERNS, ...userPatterns]

    if (allPatterns.some((pattern) => pattern.test(filename))) {
      return {}
    }

    return {
      CallExpression(node) {
        const { callee } = node
        if (callee.type !== AST_NODE_TYPES.MemberExpression) return
        if (callee.property.type !== AST_NODE_TYPES.Identifier) return

        const method = callee.property.name
        if (method !== 'pushState' && method !== 'replaceState') return

        if (!isHistoryObject(callee.object)) return

        context.report({ node, messageId: 'preferLocationService', data: { method } })
      },
    }
  },
})
