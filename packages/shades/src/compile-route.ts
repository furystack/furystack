import { compile } from 'path-to-regexp'

const stringifyObjectValues = (params: Record<string, any>) =>
  Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value?.toString()]))

export const compileRoute = <T extends Object>(url: string, params: T) => compile(url)(stringifyObjectValues(params))
