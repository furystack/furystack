import Semaphore from 'semaphore-async-await'
import { Disposable } from '@furystack/utils/src'

/**
 * Readonly set that stores references of the disposables that should be disposed on process exit
 */
export const globalDisposables: Set<Disposable> = new Set()

export const cleanupLock = new Semaphore(1)

/**
 * Will be triggered via process event listeners
 */
export const exitHandler = (async (exitCode: any) => {
  try {
    await cleanupLock.acquire()
    for (const disposable of globalDisposables) {
      console.log(`Cleaning up ${disposable.constructor.name}`)
      await disposable.dispose()
    }
    console.log(`Cleanup done, exited with code '${exitCode}'....`)
  } catch (error) {
    console.error('Error during cleanup!', error)
  } finally {
    cleanupLock.release()
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
