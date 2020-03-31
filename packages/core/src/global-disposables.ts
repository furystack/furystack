import { Disposable } from '@furystack/utils'

/**
 * Readonly set that stores references of the disposables that should be disposed on process exit
 */
export const globalDisposables: Set<Disposable> = new Set()

/**
 * Will be triggered via process event listeners
 */
export const exitHandler = (async () => {
  const result = await Promise.allSettled([...globalDisposables].map((d) => d.dispose()))
  const fails = result.filter((r) => r.status === 'rejected')
  if (fails && fails.length) {
    console.warn(`There was an error during disposing '${fails.length}' global disposable objects`, fails)
  }
}).bind(null)

// do something when app is closing
process.on('exit', exitHandler)

// catches ctrl+c event
process.on('SIGINT', exitHandler)

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler)
process.on('SIGUSR2', exitHandler)

// catches uncaught exceptions
process.on('uncaughtException', exitHandler)
