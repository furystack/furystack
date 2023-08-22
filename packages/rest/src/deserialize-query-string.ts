/**
 *
 * Decoding steps: See the encoding steps in reverse order
 * @param value The value to decode
 * @returns The decoded value
 */
export const decode = <T>(value: string) => JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(value))))) as T

export const deserializeQueryString = (fullQueryString: string) => {
  const params = [...new URLSearchParams(fullQueryString).entries()]
    .filter(([key, value]) => key && value)
    .map(([key, value]) => [key, decode(value)])

  return Object.fromEntries(params)
}
