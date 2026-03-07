import type { OpenApiDocument } from './openapi-document.js'

/**
 * Resolves an internal JSON Pointer (e.g. `#/components/schemas/User`) against a document tree.
 */
const resolvePointer = (root: unknown, pointer: string): unknown => {
  const segments = pointer
    .replace(/^#\//, '')
    .split('/')
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))

  let current: unknown = root
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/**
 * Deep-walks a value and replaces all `{ $ref: "#/..." }` objects with the resolved target.
 * Tracks visited `$ref` strings to prevent infinite loops from circular references.
 */
const resolveNode = (node: unknown, root: unknown, visited: Set<string>): unknown => {
  if (node === null || node === undefined || typeof node !== 'object') return node

  if (Array.isArray(node)) {
    return node.map((item) => resolveNode(item, root, visited))
  }

  const obj = node as Record<string, unknown>

  if (typeof obj.$ref === 'string') {
    const ref = obj.$ref
    if (!ref.startsWith('#/')) return node
    if (visited.has(ref)) return {}
    visited.add(ref)
    const resolved = resolvePointer(root, ref)
    if (resolved === undefined) return node
    const result = resolveNode(resolved, root, new Set(visited))
    visited.delete(ref)
    return result
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveNode(value, root, visited)
  }
  return result
}

/**
 * Resolves all internal `$ref` pointers in an OpenAPI document, inlining the referenced objects.
 *
 * Only internal references (`#/...`) are supported. External file references are left as-is.
 * Circular references are broken by substituting an empty object `{}`.
 *
 * @param doc - The OpenAPI document with `$ref` pointers
 * @returns A new OpenAPI document with all internal `$ref` pointers resolved
 *
 * @example
 * ```typescript
 * import { resolveOpenApiRefs } from '@furystack/rest'
 *
 * const resolved = resolveOpenApiRefs(myOpenApiDoc)
 * // All $ref pointers have been replaced with the actual schemas
 * ```
 */
export const resolveOpenApiRefs = (doc: OpenApiDocument): OpenApiDocument => {
  return resolveNode(structuredClone(doc), doc, new Set()) as OpenApiDocument
}
