import { CacheLockManager } from './cache-lock-manager.js'
import { describe, it, expect } from 'vitest'

describe('CacheLockManager', () => {
  it('Should be able to construct and dispose', () => {
    const lockManager = new CacheLockManager()
    lockManager[Symbol.dispose]()
  })

  it('Should be able to acquire and release a lock', async () => {
    const lockManager = new CacheLockManager()
    const lock = await lockManager.acquireLock('test')
    expect(lock).toBeTruthy()
    lockManager.releaseLock('test')
    lockManager[Symbol.dispose]()
  })
})
