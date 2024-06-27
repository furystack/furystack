import { isAsyncDisposable } from './is-async-disposable.js'
import { isDisposable } from './is-disposable.js'

/**
 * Method that accepts an IDisposable resource that will be disposed after the callback
 * @param resource The resource that is used in the callback and will be disposed afterwards
 * @param callback The callback that will be executed asynchrounously before the resource will be disposed
 * @returns A promise that will be resolved with a return value after the resource is disposed
 */
export const usingAsync = async <T extends Disposable | AsyncDisposable, TReturns>(
  resource: T,
  callback: (r: T) => Promise<TReturns>,
) => {
  try {
    return await callback(resource)
  } finally {
    if (isAsyncDisposable(resource)) {
      await resource[Symbol.asyncDispose]()
    }
    if (isDisposable(resource)) {
      resource[Symbol.dispose]()
    }
  }
}
