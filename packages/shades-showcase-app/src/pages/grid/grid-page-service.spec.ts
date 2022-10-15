import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, it, expect } from 'vitest'
import { GridPageService } from './grid-page-service.js'
describe('GridPageService', () => {
  it('should be populated with a default state', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const instance = await injector.getInstance(GridPageService)
      expect(instance['isInitialized']).toBe(false)

      await instance.init()
      expect(instance['isInitialized']).toBe(true)

      await instance.collectionService.getEntries({})
      expect(instance.collectionService.data.getValue().count).toBe(100)
    })
  })
})
