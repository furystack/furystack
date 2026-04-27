import { isAsyncDisposable } from './is-async-disposable.js'
import { isDisposable } from './is-disposable.js'
import type { using } from './using.js'

/**
 * Async counterpart of {@link using}. Awaits `callback`, then disposes
 * `resource` in a `finally` block — async disposers are awaited. Resolves to
 * `callback`'s value.
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
