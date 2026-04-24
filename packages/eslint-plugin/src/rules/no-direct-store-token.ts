import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { ParserServicesWithTypeInformation, TSESTree } from '@typescript-eslint/utils'
import type * as ts from 'typescript'
import { createRule } from '../create-rule.js'
import { getTypeServices } from '../utils/type-services.js'

const ALLOWED_PATH_PATTERNS = [
  /\.spec\.tsx?$/,
  /packages[/\\]core[/\\]/,
  /packages[/\\]repository[/\\]/,
  /[-\w]*store[/\\]/,
]

/**
 * Resolved value types whose presence on the token's `__type` phantom property
 * marks the token as a {@link DataSetToken} (write gateway) rather than a
 * {@link StoreToken} (raw physical store). When the resolved type matches one
 * of these names the token is allowed.
 */
const DATA_SET_RESOLVED_TYPE_NAMES = new Set(['DataSet'])

/**
 * Walks a TypeScript type and returns every constituent symbol/alias name —
 * unwrapping unions and intersections so the discriminator below works on
 * both `T | undefined` (the phantom property's actual type) and
 * `Token<T> & { model, primaryKey }` (the intersection produced by
 * `Object.assign`).
 */
const collectTypeNames = (type: ts.Type): string[] => {
  const names: string[] = []
  const visit = (current: ts.Type): void => {
    const aliasName = current.aliasSymbol?.name
    if (aliasName) names.push(aliasName)
    const symbolName = current.getSymbol()?.name
    if (symbolName) names.push(symbolName)
    if (current.isUnion() || current.isIntersection()) {
      for (const constituent of current.types) visit(constituent)
    }
  }
  visit(type)
  return names
}

/**
 * A {@link StoreToken} is a `Token` whose `__type` resolves to a
 * {@link PhysicalStore}. A {@link DataSetToken} is structurally identical at
 * the token surface (both carry `model` + `primaryKey`); the only reliable
 * discriminator is the resolved value type itself.
 *
 * Strategy:
 *
 * 1. Quick syntactic shape check (`id` + `factory` + `model` + `primaryKey`).
 *    Tokens missing any of these are plain service tokens and not our concern.
 * 2. Inspect the token type's `__type` phantom property — it carries
 *    `TService` from the `Token<TService, ...>` generic. If the resolved type
 *    is (or contains) `DataSet`, this is a `DataSetToken` — allow.
 * 3. Otherwise fall back to the alias-name fast path (`StoreToken` /
 *    `DataSetToken`) so the rule still works when type-information is sparse.
 */
const isStoreTokenType = (services: ParserServicesWithTypeInformation, node: TSESTree.Node): boolean => {
  const type = services.getTypeAtLocation(node)
  const hasModel = type.getProperty('model') !== undefined
  const hasPrimaryKey = type.getProperty('primaryKey') !== undefined
  const hasTokenShape = type.getProperty('id') !== undefined && type.getProperty('factory') !== undefined
  if (!hasModel || !hasPrimaryKey || !hasTokenShape) return false

  const tokenAliasNames = new Set(collectTypeNames(type))
  if (tokenAliasNames.has('DataSetToken')) return false

  const phantomSymbol = type.getProperty('__type')
  if (phantomSymbol) {
    const checker = services.program.getTypeChecker()
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    const phantomType = checker.getTypeOfSymbolAtLocation(phantomSymbol, tsNode)
    const resolvedNames = collectTypeNames(phantomType)
    if (resolvedNames.some((name) => DATA_SET_RESOLVED_TYPE_NAMES.has(name))) return false
  }

  return true
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
