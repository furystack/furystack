/**
 * Trailing-edge debounce. Each call resets the timer; `method` runs once
 * after `debounceMs` of inactivity. The returned wrapper is fire-and-forget
 * — its declared return type matches the wrapped method's signature for
 * callers, but the wrapper actually returns `void` at runtime.
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
