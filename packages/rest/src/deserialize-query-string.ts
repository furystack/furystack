/**
 * Decodes a URL-safe base64 encoded JSON string back to its original value
 * Decoding steps: See the encoding steps in reverse order
 * @param value The value to decode
 * @returns The decoded value
 */
export const decode = <T>(value: string) => JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(value))))) as T

export const deserializeQueryString = (fullQueryString: string) => {
  const params = [...new URLSearchParams(fullQueryString).entries()]
    .filter(([key, value]) => key && value)
    .map(([key, value]) => [key, decode(value)] as const)

  return Object.fromEntries(params) as Record<string, unknown>
}
