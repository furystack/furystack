import { compile } from 'path-to-regexp'

const stringifyObjectValues = (params: Record<string, any>) =>
  Object.fromEntries(Object.entries(params).map(([key, value]) => [key, (value as string)?.toString()]))

/**
 * Resolves a `path-to-regexp` URL pattern (e.g. `/users/:id`) by substituting
 * `params` and string-coercing each value. Used internally by routing
 * helpers to build hrefs from typed param objects.
 */
export const compileRoute = <T extends object>(url: string, params: T) => compile(url)(stringifyObjectValues(params))
