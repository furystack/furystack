import Semaphore from 'semaphore-async-await'
import type { Disposable } from '@furystack/utils'

export class CacheLockManager implements Disposable {
  public dispose() {
    this.locks.clear()
  }

  private getLock(index: string) {
    const fromLocks = this.locks.get(index)
    if (fromLocks) {
      return fromLocks
    }
    const lock = new Semaphore(1)
    this.locks.set(index, lock)
    return lock
  }

  /**
   *
   * @param index The index of the lock
   * @returns A promise that resolves to true if the lock was acquired, false if it was already acquired
   */
  public acquireLock(index: string): Promise<boolean> {
    return this.getLock(index).acquire()
  }

  /**
   * Releases the lock
   *
   * @param index The index of the lock
   */
  public releaseLock(index: string) {
    const lock = this.getLock(index)
    lock.release()
  }

  /**
   * Stores the locks by their keys to prevent parallel loading issues
   */
  public readonly locks = new Map<string, Semaphore>()
}
