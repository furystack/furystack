import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { GetEntityEndpoint } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import { MockClass, setupContext } from './utils.js'
import { createGetEntityEndpoint } from './create-get-entity-endpoint.js'
import { getDataSetFor } from '@furystack/repository'
import { useRestService } from '../helpers.js'
import { describe, it, expect } from 'vitest'

describe('createGetEntityEndpoint', () => {
  it('Should return the entity', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/:id': createGetEntityEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await getDataSetFor(i, MockClass, 'id').add(i, mockEntity)

      const response = await fetch('http://127.0.0.1:1113/api/mock', { method: 'GET' })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual(mockEntity)
    })
  })

  it('Should return the entity with the selected fields', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1114,
        api: {
          GET: {
            '/:id': createGetEntityEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await getDataSetFor(i, MockClass, 'id').add(i, mockEntity)

      const response = await fetch(`http://127.0.0.1:1114/api/mock?${serializeToQueryString({ select: ['id'] })}`, {
        method: 'GET',
      })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ id: mockEntity.id })
    })
  })

  it('Should return 404 if no entity has been found', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1115,
        api: {
          GET: {
            '/:id': createGetEntityEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const result = await fetch(`http://127.0.0.1:1115/api/mock`, { method: 'GET' })
      expect(result.status).toBe(404)
      const body = await result.json()
      expect(body).toEqual({ message: 'Entity not found' })
    })
  })
})
