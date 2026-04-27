export const isDisposable = (value: unknown): value is Disposable => {
  return (value as Disposable)?.[Symbol.dispose] instanceof Function
}
