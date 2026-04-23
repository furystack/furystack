import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { DeleteEndpoint } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createDeleteEndpoint } from './create-delete-endpoint.js'
import type { MockClass } from './utils.js'
import { MockDataSet, setupContext } from './utils.js'

describe('createDeleteEndpoint', () => {
  it('deletes the entity and responds 204', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ DELETE: { '/:id': DeleteEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { DELETE: { '/:id': createDeleteEndpoint(MockDataSet) } },
      })
      const dataSet = i.get(MockDataSet)
      await dataSet.add(i, { id: 'mock', value: 'mock' })
      expect(await dataSet.count(i)).toBe(1)

      const response = await fetch(`http://127.0.0.1:${port}/api/mock`, { method: 'DELETE' })
      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
      expect(await dataSet.count(i)).toBe(0)
    })
  })
})
