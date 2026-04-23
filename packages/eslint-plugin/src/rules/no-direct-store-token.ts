import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { ParserServicesWithTypeInformation, TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getTypeServices } from '../utils/type-services.js'

const ALLOWED_PATH_PATTERNS = [
  /\.spec\.tsx?$/,
  /packages[/\\]core[/\\]/,
  /packages[/\\]repository[/\\]/,
  /[-\w]*store[/\\]/,
]

/**
 * A {@link StoreToken} is a `Token` enriched with `model` and `primaryKey`
 * metadata. The rule detects this structurally so both explicit annotations
 * (`const X: StoreToken<T, PK> = ...`) and inferred ones (from
 * `defineStore(...)`) are caught.
 */
const isStoreTokenType = (services: ParserServicesWithTypeInformation, node: TSESTree.Node): boolean => {
  const type = services.getTypeAtLocation(node)
  const hasModel = type.getProperty('model') !== undefined
  const hasPrimaryKey = type.getProperty('primaryKey') !== undefined
  const hasTokenShape = type.getProperty('id') !== undefined && type.getProperty('factory') !== undefined
  return hasModel && hasPrimaryKey && hasTokenShape
}

/**
 * Prevents direct `injector.get(SomeStoreToken)` / `injector.getAsync(...)`
 * calls in application code, enforcing `getDataSetFor()` / an
 * `injector.get(SomeDataSetToken)` resolution instead.
 *
 * Direct `StoreToken` resolution bypasses the DataSet layer — authorization,
 * modification hooks, and entity-sync events do not run.
 */
export const noDirectStoreToken = createRule({
  name: 'no-direct-store-token',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prefer resolving a DataSetToken (via injector.get or getDataSetFor from @furystack/repository) over resolving a StoreToken directly. Direct physical-store access bypasses authorization, modification hooks, and entity-sync events.',
    },
    messages: {
      noStoreTokenResolve:
        'Avoid resolving a StoreToken directly in application code. Resolve a DataSetToken instead (defineDataSet + injector.get(...) or getDataSetFor(...) from @furystack/repository).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename ?? context.getFilename()

    if (ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(filename))) {
      return {}
    }

    const services = getTypeServices(context)
    if (!services) return {}

    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return
        const methodName = node.callee.property.name
        if (methodName !== 'get' && methodName !== 'getAsync') return
        const firstArg = node.arguments[0]
        if (!firstArg) return
        if (firstArg.type === AST_NODE_TYPES.SpreadElement) return
        if (!isStoreTokenType(services, firstArg)) return
        context.report({ node: firstArg, messageId: 'noStoreTokenResolve' })
      },
    }
  },
})
