/**
 * Method that accepts a Disposable resource that will be disposed after the callback
 * @param resource The resource that is used in the callback and will be disposed afterwards
 * @param callback The callback that will be executed synchronously before the resource will be disposed
 * @returns the value that will be returned by the callback method
 */
export const using = <T extends Disposable, TReturns>(resource: T, callback: (r: T) => TReturns) => {
  try {
    return callback(resource)
  } finally {
    resource[Symbol.dispose]()
  }
}
