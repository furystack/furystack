export const isAsyncDisposable = (value: unknown): value is AsyncDisposable => {
  return (value as AsyncDisposable)?.[Symbol.asyncDispose] instanceof Function
}
