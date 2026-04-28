/**
 * Runs `callback` with `resource`, then disposes `resource` in a `finally`
 * block — including when `callback` throws. Returns `callback`'s value.
 */
export const using = <T extends Disposable, TReturns>(resource: T, callback: (r: T) => TReturns) => {
  try {
    return callback(resource)
  } finally {
    resource[Symbol.dispose]()
  }
}
