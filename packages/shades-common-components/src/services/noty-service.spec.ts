import { describe, expect, it } from 'vitest'
import type { NotyModel } from './noty-service.js'
import { NotyService } from './noty-service.js'
import { using } from '@furystack/utils'

describe('NotyService', () => {
  it('Should add and removea noty', () => {
    using(new NotyService(), (notyService) => {
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
