/**
 * Returns a method that wraps the original one with an async debounce
 * @param method The method that should be debounced
 * @param debounceMs The timeout in millisecs
 */
export const debounce = <TArgs extends any[], TReturns>(method: (...args: TArgs) => TReturns, debounceMs = 250) => {
  let timeout: any
  return ((...args: TArgs) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      method(...args)
      clearTimeout(timeout)
      timeout = undefined
    }, debounceMs)
  }) as (...args: TArgs) => TReturns
}
