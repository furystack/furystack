/**
 * @param value The value to check
 * @returns whether the value is an instance of an async disposable object
 */
export const isAsyncDisposable = (value: unknown): value is AsyncDisposable => {
  return (value as AsyncDisposable)?.[Symbol.asyncDispose] instanceof Function
}
