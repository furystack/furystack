import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { DeleteEndpoint } from '@furystack/rest'
import { createDeleteEndpoint } from './create-delete-endpoint'
import { MockClass, setupContext } from './utils'
import { useRestService } from '../helpers'
import { getDataSetFor } from '@furystack/repository'
import { describe, it, expect } from 'vitest'

describe('createDeleteEndpoint', () => {
  it('Should delete the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ DELETE: { '/:id': DeleteEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1111,
        api: {
          DELETE: {
            '/:id': createDeleteEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await getDataSetFor(i, MockClass, 'id').add(i, { id: 'mock', value: 'mock' })

      const countBeforeDelete = await getDataSetFor(i, MockClass, 'id').count(i)
      expect(countBeforeDelete).toBe(1)

      const response = await fetch('http://127.0.0.1:1111/api/mock', { method: 'DELETE' })
      expect(response.status).toBe(204)
      const txt = await response.text()
      expect(txt).toBe('')

      const countAfterDelete = await getDataSetFor(i, MockClass, 'id').count(i)
      expect(countAfterDelete).toBe(0)
    })
  })
})
