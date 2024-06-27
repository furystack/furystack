/**
 *
 * You can implement *IDisposable* resources and use them with a *using()* or *usingAsync()* syntax.
 *
 * Usage example:
 *
 * ```ts
 * class Resource implements IDisposable{
 *       dispose(){
 *           // cleanup logics
 *      }
 * }
 *
 *
 * using(new Resource(), (resource)=>{
 *      // do something with the resource
 * })
 *
 * usingAsync(new Resource(), async (resource)=>{
 *      // do something with the resource, allows awaiting promises
 * })
 * ```
 */
/** */

/**
 * Method that accepts an IDisposable resource that will be disposed after the callback
 * @param resource The resource that is used in the callback and will be disposed afterwards
 * @param callback The callback that will be executed synchrounously before the resource will be disposed
 * @returns the value that will be returned by the callback method
 */
export const using = <T extends Disposable, TReturns>(resource: T, callback: (r: T) => TReturns) => {
  try {
    return callback(resource)
  } finally {
    resource[Symbol.dispose]()
  }
}

/**
 * Method that accepts an IDisposable resource that will be disposed after the callback
 * @param resource The resource that is used in the callback and will be disposed afterwards
 * @param callback The callback that will be executed asynchrounously before the resource will be disposed
 * @returns A promise that will be resolved with a return value after the resource is disposed
 */
export const usingAsync = async <T extends AsyncDisposable, TReturns>(
  resource: T,
  callback: (r: T) => Promise<TReturns>,
) => {
  try {
    return await callback(resource)
  } finally {
    await resource[Symbol.asyncDispose]()
  }
}
