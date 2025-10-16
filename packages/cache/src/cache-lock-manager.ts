import { Lock } from 'semaphore-async-await'

export class CacheLockManager implements Disposable {
  public [Symbol.dispose]() {
    this.locks.clear()
  }

  private getLock(index: string) {
    const fromLocks = this.locks.get(index)
    if (fromLocks) {
      return fromLocks
    }
    const lock = new Lock()
    this.locks.set(index, lock)
    return lock
  }

  /**
   * Acquires a lock for the given index
   * @param index The index of the lock
   * @returns A promise that resolves to true if the lock was acquired, false if it was already acquired
   */
  public acquireLock(index: string): Promise<boolean> {
    return this.getLock(index).acquire()
  }

  /**
   * Releases the lock
   * @param index The index of the lock
   */
  public releaseLock(index: string) {
    const lock = this.getLock(index)
    lock.release()
  }

  /**
   * Stores the locks by their keys to prevent parallel loading issues
   */
  public readonly locks = new Map<string, Lock>()
}
