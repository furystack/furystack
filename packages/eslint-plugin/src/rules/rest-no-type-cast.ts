import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getTypeServices } from '../utils/type-services.js'
import {
  classifyTypedApiCallee,
  isUnsafeAssertionNode,
  unwrapAssertions,
  walkForDirectCasts,
} from '../utils/typed-api-call.js'

/**
 * Forbids type assertions (`as T`, `<T>x`, `x!`) inside the argument list, on
 * the callee, or on the awaited `.result` of calls that target a furystack
 * typed REST API (`createClient<T>()` / `useRestService<T>()`). Such casts
 * silently defeat the generic constraints these APIs rely on.
 */
export const restNoTypeCast = createRule({
  name: 'rest-no-type-cast',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid type assertions inside typed REST API calls. Casts in createClient()/useRestService() argument positions or on their results bypass the typed generic signatures and reintroduce the class of bug the typed API is designed to prevent.',
    },
    messages: {
      castInArg:
        'Avoid type assertions inside typed REST API call arguments — they bypass the types derived from the RestApi contract. Refactor the value or narrow with a type guard; if unavoidable, add an explicit eslint-disable-next-line with a reason.',
      castOnCallee:
        'Avoid asserting the type of a typed REST API callee — it disables argument and return-type checking for the entire call.',
      castOnResult:
        'Avoid asserting the `.result` of a typed REST call — the result type is already derived from the RestApi contract. A mismatch here indicates either a contract change or a bug.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = getTypeServices(context)
    if (!services) return {}

    const reportCast = (node: TSESTree.Node, messageId: 'castInArg' | 'castOnCallee' | 'castOnResult') => {
      context.report({ node, messageId })
    }

    return {
      CallExpression(node) {
        const kind = classifyTypedApiCallee(services, node.callee)
        if (kind !== 'rest') return

        if (unwrapAssertions(node.callee) !== node.callee) {
          reportCast(node.callee, 'castOnCallee')
        }

        for (const arg of node.arguments) {
          walkForDirectCasts(arg, (castNode) => reportCast(castNode, 'castInArg'))
        }
      },

      TSAsExpression(node) {
        if (!isUnsafeAssertionNode(node)) return
        const inner = node.expression
        if (inner.type !== AST_NODE_TYPES.MemberExpression) return
        if (inner.property.type !== AST_NODE_TYPES.Identifier || inner.property.name !== 'result' || inner.computed) {
          return
        }
        const source = inner.object.type === AST_NODE_TYPES.AwaitExpression ? inner.object.argument : inner.object
        if (source.type !== AST_NODE_TYPES.CallExpression) return
        const kind = classifyTypedApiCallee(services, source.callee)
        if (kind !== 'rest') return

        reportCast(node, 'castOnResult')
      },
    }
  },
})
