import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { DeleteEndpoint } from '@furystack/rest'
import { createDeleteEndpoint } from './create-delete-endpoint.js'
import { MockClass, setupContext } from './utils.js'
import { useRestService } from '../helpers.js'
import { getDataSetFor } from '@furystack/repository'
import { describe, it, expect } from 'vitest'
import { getPort } from '@furystack/core/port-generator'

describe('createDeleteEndpoint', () => {
  it('Should delete the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      const port = getPort()
      setupContext(i)
      await useRestService<{ DELETE: { '/:id': DeleteEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
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
