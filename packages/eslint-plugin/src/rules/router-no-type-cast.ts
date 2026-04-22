import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getTypeServices } from '../utils/type-services.js'
import { classifyTypedApiCallee, unwrapAssertions, walkForDirectCasts } from '../utils/typed-api-call.js'

/**
 * Forbids type assertions (`as T`, `<T>x`, `x!`) flowing directly into the
 * argument or prop positions of a furystack shades nested router API
 * (`createNestedNavigate`, `createNestedReplace`, `createNestedRouteLink`,
 * `createNestedHooks`). Casts here silently defeat path / params / query /
 * hash narrowing derived from the route tree.
 */
export const routerNoTypeCast = createRule({
  name: 'router-no-type-cast',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid type assertions inside nested router API calls (navigate/replace/link/hooks). Casts on path, params, query or hash bypass the types derived from the route tree and reintroduce the bugs the typed router is designed to prevent.',
    },
    messages: {
      castInArg:
        'Avoid type assertions inside nested router call arguments — they bypass the types derived from the route tree. Refactor the value or narrow with a type guard; if unavoidable, add an explicit eslint-disable-next-line with a reason.',
      castOnCallee:
        'Avoid asserting the type of a nested router callee — it disables argument checking for the entire call.',
      castInProp:
        'Avoid type assertions inside nested router component props — they bypass the types derived from the route tree.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = getTypeServices(context)
    if (!services) return {}

    return {
      CallExpression(node) {
        const kind = classifyTypedApiCallee(services, node.callee)
        if (kind !== 'router') return

        if (unwrapAssertions(node.callee) !== node.callee) {
          context.report({ node: node.callee, messageId: 'castOnCallee' })
        }

        for (const arg of node.arguments) {
          walkForDirectCasts(arg, (castNode) => context.report({ node: castNode, messageId: 'castInArg' }))
        }
      },

      JSXOpeningElement(node) {
        const { name } = node
        if (name.type !== AST_NODE_TYPES.JSXIdentifier) return
        const kind = classifyTypedApiCallee(services, name)
        if (kind !== 'router') return

        for (const attr of node.attributes) {
          if (attr.type !== AST_NODE_TYPES.JSXAttribute) continue
          if (!attr.value) continue
          if (attr.value.type !== AST_NODE_TYPES.JSXExpressionContainer) continue
          const expr = attr.value.expression
          if (expr.type === AST_NODE_TYPES.JSXEmptyExpression) continue
          walkForDirectCasts(expr, (castNode) => context.report({ node: castNode, messageId: 'castInProp' }))
        }
      },
    }
  },
})
