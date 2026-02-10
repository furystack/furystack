import { using, usingAsync } from '@furystack/utils'
import { CacheLockManager } from './cache-lock-manager.js'
import { describe, it, expect } from 'vitest'

describe('CacheLockManager', () => {
  it('Should be able to construct and dispose', () => {
    using(new CacheLockManager(), () => {
      // Constructed and disposed automatically
    })
  })

  it('Should be able to acquire and release a lock', async () => {
    await usingAsync(new CacheLockManager(), async (lockManager) => {
      const lock = await lockManager.acquireLock('test')
      expect(lock).toBeTruthy()
      lockManager.releaseLock('test')
    })
  })
})
