import { Disposable } from '@sensenet/client-utils'
import Semaphore from 'semaphore-async-await'

process.stdin.resume() // so the program will not close instantly

/**
 * Registers a custom event handler on exit. The provided disposables will be cleaned up on exit
 * @param disposables List of disposable objects that should be cleaned up before exiting
 */
export const registerExitHandler = (...disposables: Disposable[]) => {
  const cleanupLock = new Semaphore(1)

  const exitHandler = async (options: { cleanup?: boolean }, exitCode: any) => {
    try {
      await cleanupLock.acquire()
      if (options.cleanup) {
        for (const disposable of disposables) {
          console.log(`Cleaning up ${disposable.constructor.name}`)
          await disposable.dispose()
        }
        console.log(`Cleanup done, exited with code '${exitCode}'....`)
        process.exit()
        return
      } else {
        console.log(`Exiting with code '${exitCode}'....`)
        process.exit()
      }
    } catch (error) {
      console.error('Error during cleanup!', error)
    } finally {
      cleanupLock.release()
    }
  }

  // do something when app is closing
  process.on('exit', exitHandler.bind(null, { cleanup: true }))

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { cleanup: true }))

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { cleanup: true }))
  process.on('SIGUSR2', exitHandler.bind(null, { cleanup: true }))

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, { cleanup: true }))
}
