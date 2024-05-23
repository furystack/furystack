import type { Disposable } from '@furystack/utils'

/**
 * Readonly set that stores references of the disposables that should be disposed on process exit
 */
export const globalDisposables: Set<Disposable> = new Set()

/**
 * Will be triggered via process event listeners
 */
export const exitHandler = (() => {
  Promise.allSettled([...globalDisposables].map((d) => d.dispose()))
    .then((result) => {
      const fails = result.filter((r) => r.status === 'rejected')
      if (fails && fails.length) {
        console.warn(`There was an error during disposing '${fails.length}' global disposable objects`, fails)
      }
    })
    .catch(() => {
      /** should not happen with allSettled */
    })
}).bind(null)

// do something when app is closing
globalThis.process?.on?.('exit', exitHandler)

// catches ctrl+c event
globalThis.process?.on?.('SIGINT', exitHandler)

globalThis.process?.on?.('SIGTERM', () => exitHandler)

// catches "kill pid" (for example: nodemon restart)
globalThis.process?.on?.('SIGUSR1', exitHandler)
globalThis.process?.on?.('SIGUSR2', exitHandler)

// catches uncaught exceptions
globalThis.process?.on?.('uncaughtException', exitHandler)

// Browser environment
;(globalThis instanceof Window || globalThis instanceof Document) &&
  globalThis.window?.addEventListener('beforeunload', exitHandler)
