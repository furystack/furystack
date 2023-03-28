import { CacheLockManager } from './cache-lock-manager'

describe('CacheLockManager', () => {
  it('Should be able to construct and dispose', () => {
    const lockManager = new CacheLockManager()
    lockManager.dispose()
  })

  it('Should be able to acquire and release a lock', async () => {
    const lockManager = new CacheLockManager()
    const lock = await lockManager.acquireLock('test')
    expect(lock).toBeTruthy()
    lockManager.releaseLock('test')
    lockManager.dispose()
  })
})
