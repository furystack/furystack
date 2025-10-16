/**
 * @param value The value to check
 * @returns whether the value is an instance of a disposable object
 */
export const isDisposable = (value: unknown): value is Disposable => {
  return (value as Disposable)?.[Symbol.dispose] instanceof Function
}
