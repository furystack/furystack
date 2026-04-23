import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import type { NotyModel } from './noty-service.js'
import { NotyService } from './noty-service.js'

describe('NotyService', () => {
  it('Should add and removea noty', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const notyService = injector.get(NotyService)
      expect(notyService.getNotyList()).toEqual([])

      const exampleNoty: NotyModel = {
        type: 'info',
        title: 'Test',
        body: 'Test',
      }

      notyService.emit('onNotyAdded', exampleNoty)

      expect(notyService.getNotyList()).toEqual([exampleNoty])

      notyService.emit('onNotyRemoved', exampleNoty)

      expect(notyService.getNotyList()).toEqual([])
    })
  })
})
