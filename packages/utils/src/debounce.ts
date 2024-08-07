/**
 * @param method The method that should be debounced
 * @param debounceMs The timeout in millisecs
 * @returns a method that wraps the original one with an async debounce
 */
export const debounce = <TArgs extends unknown[], TReturns>(method: (...args: TArgs) => TReturns, debounceMs = 250) => {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return ((...args: TArgs) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      method(...args)
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = undefined
    }, debounceMs)
  }) as (...args: TArgs) => TReturns
}
