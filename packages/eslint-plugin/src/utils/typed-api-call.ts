import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { ParserServicesWithTypeInformation, TSESTree } from '@typescript-eslint/utils'
import * as ts from 'typescript'

/**
 * Identifies which kind of furystack typed API a given callee belongs to.
 *
 * - `rest`: REST client or REST service — see `@furystack/rest-client-fetch` and
 *   `@furystack/rest-service`.
 * - `router`: Shades nested router factories — see `@furystack/shades`.
 */
export type TypedApiKind = 'rest' | 'router'

const REST_DIRECT_NAMES = new Set(['useRestService'])
const REST_FACTORY_NAMES = new Set(['createClient'])
const ROUTER_DIRECT_NAMES = new Set<string>()
const ROUTER_FACTORY_NAMES = new Set([
  'createNestedNavigate',
  'createNestedReplace',
  'createNestedRouteLink',
  'createNestedHooks',
])

const classifyByDirectName = (name: string): TypedApiKind | null => {
  if (REST_DIRECT_NAMES.has(name)) return 'rest'
  if (ROUTER_DIRECT_NAMES.has(name)) return 'router'
  return null
}

const classifyByFactoryName = (name: string): TypedApiKind | null => {
  if (REST_FACTORY_NAMES.has(name)) return 'rest'
  if (ROUTER_FACTORY_NAMES.has(name)) return 'router'
  return null
}

const resolveAlias = (symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol => {
  let current = symbol
  while (current.flags & ts.SymbolFlags.Alias) {
    try {
      current = checker.getAliasedSymbol(current)
    } catch {
      return current
    }
  }
  return current
}

const getRootVariableInitializer = (decl: ts.Declaration): ts.Expression | undefined => {
  if (ts.isVariableDeclaration(decl)) return decl.initializer
  if (ts.isBindingElement(decl)) {
    let { parent } = decl as { parent: ts.Node | undefined }
    while (parent && !ts.isVariableDeclaration(parent)) {
      ;({ parent } = parent as { parent: ts.Node | undefined })
    }
    return parent && ts.isVariableDeclaration(parent) ? parent.initializer : undefined
  }
  return undefined
}

/**
 * Unwraps leading type assertions / non-null from an expression node.
 *
 * Used to look through `(foo as any)()` or `foo!()` to reach the underlying
 * identifier we want to classify.
 */
export const unwrapAssertions = (node: TSESTree.Node): TSESTree.Node => {
  let current = node
  while (
    current.type === AST_NODE_TYPES.TSAsExpression ||
    current.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    current = current.expression
  }
  return current
}

/**
 * Classifies a callee (identifier or JSX identifier) as a furystack typed API,
 * by resolving its symbol and, when the symbol is a variable initialized by a
 * factory call, by inspecting that factory call's name.
 *
 * Returns `null` when the callee is not a tracked typed API.
 */
export const classifyTypedApiCallee = (
  services: ParserServicesWithTypeInformation,
  callee: TSESTree.Node,
): TypedApiKind | null => {
  const unwrapped = unwrapAssertions(callee)
  if (unwrapped.type !== AST_NODE_TYPES.Identifier && unwrapped.type !== AST_NODE_TYPES.JSXIdentifier) {
    return null
  }

  const tsNode = services.esTreeNodeToTSNodeMap.get(unwrapped)
  const checker = services.program.getTypeChecker()
  const symbol = checker.getSymbolAtLocation(tsNode)
  if (!symbol) return null
  const resolved = resolveAlias(symbol, checker)

  const directHit = classifyByDirectName(resolved.name)
  if (directHit) return directHit

  for (const decl of resolved.declarations ?? []) {
    const init = getRootVariableInitializer(decl)
    if (init && ts.isCallExpression(init)) {
      const expr = init.expression
      if (ts.isIdentifier(expr)) {
        const hit = classifyByFactoryName(expr.text)
        if (hit) return hit
      }
    }
  }

  return null
}

/**
 * Returns `true` for a type-assertion-like node that should be flagged:
 * `x as T`, `<T>x`, and `x!`. Returns `false` for `x as const`, which is a
 * type-narrowing operator and not an unsafe assertion.
 */
export const isUnsafeAssertionNode = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.TSNonNullExpression) return true
  if (node.type === AST_NODE_TYPES.TSTypeAssertion) return true
  if (node.type === AST_NODE_TYPES.TSAsExpression) {
    const ann = node.typeAnnotation
    if (
      ann.type === AST_NODE_TYPES.TSTypeReference &&
      ann.typeName.type === AST_NODE_TYPES.Identifier &&
      ann.typeName.name === 'const'
    ) {
      return false
    }
    return true
  }
  return false
}

const STOP_SUBTREE_TYPES = new Set<string>([
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.CallExpression,
  AST_NODE_TYPES.NewExpression,
])

/**
 * Recursively walks `root` looking for unsafe type assertions that flow
 * directly into `root`'s typed position. Stops at nested function bodies and
 * nested call/new expressions, because casts inside those have their own
 * typing context and do not undermine the outer typed API's parameter type.
 */
export const walkForDirectCasts = (root: TSESTree.Node, report: (node: TSESTree.Node) => void): void => {
  const visit = (node: TSESTree.Node): void => {
    if (isUnsafeAssertionNode(node)) {
      report(node)
      return
    }

    for (const key of Object.keys(node) as Array<keyof TSESTree.Node>) {
      if (key === 'parent') continue
      const value = (node as unknown as Record<string, unknown>)[key]
      if (!value) continue
      if (Array.isArray(value)) {
        for (const item of value) {
          if (isAstNode(item) && !STOP_SUBTREE_TYPES.has(item.type)) visit(item)
        }
      } else if (isAstNode(value) && !STOP_SUBTREE_TYPES.has(value.type)) {
        visit(value)
      }
    }
  }

  visit(root)
}

const isAstNode = (value: unknown): value is TSESTree.Node =>
  typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string'
