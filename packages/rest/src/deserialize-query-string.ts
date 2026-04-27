import { RequestError } from './request-error.js'

/**
 * Reverses the encoding produced by `serializeValue`. Throws a 400
 * {@link RequestError} on malformed input — surfaces to clients as a
 * "bad request" rather than crashing the server.
 */
export const decode = <T>(value: string): T => {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(value))))) as T
  } catch {
    throw new RequestError('Failed to decode query parameter value', 400)
  }
}

/**
 * Decodes a query string into a typed object. Empty keys/values are
 * skipped. Each surviving value is deserialized via {@link decode}.
 */
export const deserializeQueryString = (fullQueryString: string) => {
  const params = [...new URLSearchParams(fullQueryString).entries()]
    .filter(([key, value]) => key && value)
    .map(([key, value]) => [key, decode(value)] as const)

  return Object.fromEntries(params) as Record<string, unknown>
}
