import { isAsyncDisposable, isDisposable } from '@furystack/utils'

/**
 * Readonly set that stores references of the disposables that should be disposed on process exit
 */
export const globalDisposables: Set<Disposable | AsyncDisposable> = new Set()

/**
 * Will be triggered via process event listeners
 */
export const exitHandler = (() =>
  Promise.allSettled(
    [...globalDisposables].map(async (d) => {
      if (isAsyncDisposable(d)) {
        await d[Symbol.asyncDispose]()
      }
      if (isDisposable(d)) {
        d[Symbol.dispose]()
      }
    }),
  )
    .then((result) => {
      const fails = result.filter((r) => r.status === 'rejected')
      if (fails && fails.length) {
        console.warn(`There was an error during disposing '${fails.length}' global disposable objects`, fails)
      }
    })
    .catch((error) => {
      console.error('Error during disposing global disposables', error)
    })).bind(null) as () => void

// do something when app is closing
globalThis.process?.on?.('exit', exitHandler)

// catches ctrl+c event
globalThis.process?.on?.('SIGINT', exitHandler)

globalThis.process?.on?.('SIGTERM', exitHandler)

// catches "kill pid" (for example: nodemon restart)
globalThis.process?.on?.('SIGUSR1', exitHandler)
globalThis.process?.on?.('SIGUSR2', exitHandler)

// catches uncaught exceptions
globalThis.process?.on?.('uncaughtException', exitHandler)

// Browser environment
globalThis.window?.addEventListener('beforeunload', exitHandler)
