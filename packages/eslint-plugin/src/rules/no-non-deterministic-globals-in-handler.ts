import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

/**
 * Member expressions that read non-deterministic state. `Date.now`,
 * `Math.random`, `crypto.randomUUID`, and `crypto.getRandomValues` all
 * return values that change between handler invocations and would
 * therefore break replay convergence (PRD §11 determinism constraints).
 */
const FORBIDDEN_MEMBERS: Array<readonly [string, string]> = [
  ['Date', 'now'],
  ['Math', 'random'],
  ['crypto', 'randomUUID'],
  ['crypto', 'getRandomValues'],
]

/**
 * Bare globals to refuse inside handler bodies. `setTimeout` /
 * `setInterval` schedule against the worker's wall clock — replay would
 * re-fire them; `fetch` performs network IO without recording the
 * request/response so successive replays diverge. Apps reach for
 * `ctx.sleep()` and (post-v1.x) `ctx.fetch()` instead.
 */
const FORBIDDEN_GLOBALS = new Set(['setTimeout', 'setInterval', 'fetch'])

/**
 * Walks up from `node` and returns `true` when any ancestor is the
 * `handler:` property of a `defineTaskHandler({...})` call expression.
 * Handlers are the only place determinism matters; helpers / hoisted
 * functions called from inside the handler are out of the rule's reach
 * — a follow-up rule can extend the analysis if needed.
 */
const isInsideTaskHandlerBody = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent
  let nestedFunctionCount = 0
  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      // Direct ancestor function: the property carrying it must be `handler`
      // on a `defineTaskHandler(...)` call argument. Inner nested functions
      // (callbacks, helpers) inside the handler body are still considered
      // part of the handler — drop the count and keep walking.
      const fn = current
      const { parent } = fn
      if (parent?.type === AST_NODE_TYPES.Property) {
        const prop = parent
        if (prop.key.type === AST_NODE_TYPES.Identifier && prop.key.name === 'handler') {
          const objExpr = prop.parent
          if (objExpr?.type === AST_NODE_TYPES.ObjectExpression) {
            const callExpr = objExpr.parent
            if (
              callExpr?.type === AST_NODE_TYPES.CallExpression &&
              callExpr.callee.type === AST_NODE_TYPES.Identifier &&
              callExpr.callee.name === 'defineTaskHandler'
            ) {
              return true
            }
          }
        }
      }
      nestedFunctionCount++
    }
    current = current.parent
  }
  // Reached program root without seeing a `defineTaskHandler` ancestor.
  void nestedFunctionCount
  return false
}

/**
 * Prevents non-deterministic global access inside `defineTaskHandler`
 * factory bodies. `Date.now`, `Math.random`, `setTimeout`, `setInterval`,
 * `fetch`, `crypto.randomUUID`, and `crypto.getRandomValues` are flagged
 * — handlers must use the determinism-safe wrappers on `ctx.*`
 * (`ctx.now()`, `ctx.random()`, `ctx.sleep()`, etc.) so replay
 * (PRD §7.4) returns the same values across re-runs.
 *
 * `new Date()` with no arguments is also flagged because it captures
 * wall-clock time identically to `Date.now`. Calls with explicit
 * arguments (`new Date(0)`, `new Date(iso)`) are deterministic and
 * left alone.
 */
export const noNonDeterministicGlobalsInHandler = createRule({
  name: 'no-non-deterministic-globals-in-handler',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid non-deterministic global access inside defineTaskHandler factory bodies. Use the determinism-safe `ctx.*` wrappers (ctx.now, ctx.random, ctx.sleep, ctx.fetch) so replay converges across re-runs.',
    },
    messages: {
      forbiddenGlobal:
        'Non-deterministic global `{{ name }}` is forbidden inside defineTaskHandler bodies. Use `ctx.{{ replacement }}` (or another determinism-safe ctx.* wrapper) so replay converges across re-runs.',
      forbiddenNewDate:
        '`new Date()` without arguments captures wall-clock time and breaks replay determinism. Use `ctx.now()` instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        if (node.object.type !== AST_NODE_TYPES.Identifier) return
        if (node.property.type !== AST_NODE_TYPES.Identifier) return
        const objectName = node.object.name
        const propertyName = node.property.name
        const match = FORBIDDEN_MEMBERS.find(([obj, prop]) => obj === objectName && prop === propertyName)
        if (!match) return
        if (!isInsideTaskHandlerBody(node)) return
        const replacement = objectName === 'Date' ? 'now()' : objectName === 'Math' ? 'random()' : 'random()' // crypto.* mostly maps to ctx.random; apps that need UUIDs derive from ctx.random()
        context.report({
          node,
          messageId: 'forbiddenGlobal',
          data: { name: `${objectName}.${propertyName}`, replacement },
        })
      },

      Identifier(node) {
        if (!FORBIDDEN_GLOBALS.has(node.name)) return
        // Only flag bare references — calls like `obj.fetch` are fine.
        const { parent } = node
        if (parent?.type === AST_NODE_TYPES.MemberExpression && parent.property === node && !parent.computed) {
          return
        }
        if (parent?.type === AST_NODE_TYPES.Property && parent.key === node && !parent.computed) {
          return
        }
        if (!isInsideTaskHandlerBody(node)) return
        const replacement =
          node.name === 'fetch' ? 'fetch (planned in v1.x)' : node.name === 'setInterval' ? 'sleep loop' : 'sleep'
        context.report({
          node,
          messageId: 'forbiddenGlobal',
          data: { name: node.name, replacement },
        })
      },

      NewExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier) return
        if (node.callee.name !== 'Date') return
        if (node.arguments.length !== 0) return
        if (!isInsideTaskHandlerBody(node)) return
        context.report({ node, messageId: 'forbiddenNewDate' })
      },
    }
  },
})
