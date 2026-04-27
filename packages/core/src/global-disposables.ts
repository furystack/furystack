import { isAsyncDisposable, isDisposable } from '@furystack/utils'
import type { disposeOnProcessExit } from './helpers.js'

/**
 * Disposables registered for shutdown. Side-effecting on import: the
 * exported set is populated by {@link disposeOnProcessExit} and drained by
 * {@link exitHandler} on Node lifecycle signals + the browser
 * `beforeunload` event.
 */
export const globalDisposables: Set<Disposable | AsyncDisposable> = new Set()

/**
 * Shutdown handler bound to Node lifecycle signals (`exit`, `SIGINT`,
 * `SIGTERM`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`) and the browser
 * `beforeunload` event. Disposes everything in {@link globalDisposables}
 * concurrently and logs failures without rethrowing — process is already
 * exiting.
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

globalThis.process?.on?.('exit', exitHandler)
globalThis.process?.on?.('SIGINT', exitHandler)
globalThis.process?.on?.('SIGTERM', exitHandler)
// SIGUSR1 / SIGUSR2 catch nodemon-style restarts.
globalThis.process?.on?.('SIGUSR1', exitHandler)
globalThis.process?.on?.('SIGUSR2', exitHandler)
globalThis.process?.on?.('uncaughtException', exitHandler)

globalThis.window?.addEventListener('beforeunload', exitHandler)
