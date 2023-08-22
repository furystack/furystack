/**
 * Serialize steps:
 * 1. Stringify the value (even primitives, ensure type safety), e.g.: { foo: 'bar😉' } => '{"foo":"bar😉"}'
 * 2. Encode as an URI Component, e.g.: ''{"foo":"bar😉"}'' => '%7B%22foo%22%3A%22bar%F0%9F%98%89%22%7D'
 * 3. Unescape the URI Component, e.g.: '%7B%22foo%22%3A%22bar%F0%9F%98%89%22%7D' => '{"foo":"barð\x9F\x98\x89"}' - This and the first encodeURIComponent is needed because btoa only supports ASCII characters. We also don't want to encode the whole JSON string to keep a reasonable string length
 * 4. Encode the string as base64, e.g.: '{"foo":"barð\x9F\x98\x89"}' => 'eyJmb28iOiJiYXLwn5iJIn0='
 * 5. Encode as an URL Param: 'eyJmb28iOiJiYXLwn5iJIn0=' => 'eyJmb28iOiJiYXLwn5iJIn0%3D'
 * @param value The value to encode
 * @returns The encoded value that can be used as an URL search parameter
 */
export const serializeValue = (value: any) =>
  encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(value)))))

export const serializeToQueryString = <T extends object>(queryObject: T): string => {
  return new URLSearchParams(
    Object.fromEntries(
      Object.entries(queryObject)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, serializeValue(value)]),
    ),
  ).toString()
}
