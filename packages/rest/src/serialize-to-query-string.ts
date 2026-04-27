/**
 * Serializes any JSON-stringifiable value to a URL-safe base64 string
 * suitable for `application/x-www-form-urlencoded`. Pipeline:
 *
 * 1. `JSON.stringify` (preserves type info even for primitives)
 * 2. `encodeURIComponent` (UTF-8 → percent-encoded ASCII so `btoa` works)
 * 3. `unescape` (drop the percent encoding before base64)
 * 4. `btoa` (base64 — keeps the result short)
 * 5. `encodeURIComponent` (URL-safe `=` → `%3D`)
 *
 * Reversed by `decode` in `deserialize-query-string.ts`.
 */
export const serializeValue = (value: any) =>
  encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(value)))))

/**
 * Encodes an object as a query string. `undefined` values are skipped;
 * every other value is run through {@link serializeValue}.
 */
export const serializeToQueryString = <T extends object>(queryObject: T): string => {
  return new URLSearchParams(
    Object.fromEntries(
      Object.entries(queryObject)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, serializeValue(value)]),
    ),
  ).toString()
}
