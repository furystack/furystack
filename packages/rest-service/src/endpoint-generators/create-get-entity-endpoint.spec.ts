import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { GetEntityEndpoint } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createGetEntityEndpoint } from './create-get-entity-endpoint.js'
import type { MockClass } from './utils.js'
import { MockDataSet, setupContext } from './utils.js'

describe('createGetEntityEndpoint', () => {
  it('returns the entity by id', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/:id': createGetEntityEndpoint(MockDataSet) } },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await i.get(MockDataSet).add(i, mockEntity)

      const response = await fetch(`http://127.0.0.1:${port}/api/mock`, { method: 'GET' })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(mockEntity)
    })
  })

  it('honours a select query parameter', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/:id': createGetEntityEndpoint(MockDataSet) } },
      })
      await i.get(MockDataSet).add(i, { id: 'mock', value: 'mock' })

      const response = await fetch(`http://127.0.0.1:${port}/api/mock?${serializeToQueryString({ select: ['id'] })}`, {
        method: 'GET',
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ id: 'mock' })
    })
  })

  it('responds with 404 when the entity does not exist', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/:id': createGetEntityEndpoint(MockDataSet) } },
      })
      const result = await fetch(`http://127.0.0.1:${port}/api/mock`, { method: 'GET' })
      expect(result.status).toBe(404)
      expect(await result.json()).toEqual({ message: 'Entity not found' })
    })
  })
})
