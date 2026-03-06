import { ESLintUtils } from '@typescript-eslint/utils'
import type { ParserServicesWithTypeInformation, TSESLint, TSESTree } from '@typescript-eslint/utils'

/**
 * Tries to obtain parser services with TypeScript type information.
 * Returns `null` when the consuming ESLint configuration does not enable
 * type-checked linting (i.e. no `parserOptions.project`).
 */
export const getTypeServices = (
  context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>,
): ParserServicesWithTypeInformation | null => {
  try {
    return ESLintUtils.getParserServices(context)
  } catch {
    return null
  }
}

/**
 * Returns `true` when the TypeScript type of `node` can be **conclusively**
 * determined to NOT be one of the named types in `typeNames`.
 *
 * When the type cannot be resolved (e.g. `any`, `unknown`, union with
 * unresolvable constituent), returns `false` so that the caller falls
 * through to its syntactic check (no false-negative).
 */
export const isDefinitelyNotType = (
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
  typeNames: string[],
): boolean => {
  const type = services.getTypeAtLocation(node)

  if (type.isUnion()) {
    return type.types.every((t) => {
      const sym = t.getSymbol()
      return sym !== undefined && !typeNames.includes(sym.getName())
    })
  }

  const symbol = type.getSymbol() ?? type.aliasSymbol
  if (!symbol) return false
  return !typeNames.includes(symbol.getName())
}

/**
 * Returns `true` when the TypeScript type of `node` resolves to one of the
 * given type names. Handles union types (returns true if any constituent matches).
 *
 * Returns `false` when the type cannot be resolved (e.g. `any`, `unknown`).
 * Callers should combine this with the syntactic check for full coverage.
 */
export const matchesType = (
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
  typeNames: string[],
): boolean => {
  const type = services.getTypeAtLocation(node)

  if (type.isUnion()) {
    return type.types.some((t) => {
      const sym = t.getSymbol()
      return sym !== undefined && typeNames.includes(sym.getName())
    })
  }

  const symbol = type.getSymbol() ?? type.aliasSymbol
  return symbol !== undefined && typeNames.includes(symbol.getName())
}
