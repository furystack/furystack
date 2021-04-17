import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { GetEntityEndpoint, serializeToQueryString } from '@furystack/rest'
import got, { HTTPError } from 'got'
import { MockClass, setupContext } from './utils'
import { createGetEntityEndpoint } from './create-get-entity-endpoint'

describe('createGetEntityEndpoint', () => {
  it('Should return the entity', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/:id': createGetEntityEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await i.getDataSetFor(MockClass, 'id').add(i, mockEntity)

      const response = await got('http://127.0.0.1:1113/api/mock', { method: 'GET' })
      expect(JSON.parse(response.body)).toStrictEqual(mockEntity)
    })
  })

  it('Should return the entity with the selected fields', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        root: '/api',
        port: 1114,
        api: {
          GET: {
            '/:id': createGetEntityEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await i.getDataSetFor(MockClass, 'id').add(i, mockEntity)

      const response = await got(`http://127.0.0.1:1114/api/mock?${serializeToQueryString({ select: ['id'] })}`, {
        method: 'GET',
      })
      expect(JSON.parse(response.body)).toStrictEqual({ id: mockEntity.id })
    })
  })

  it('Should return 404 if no entity has been found', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/:id': GetEntityEndpoint<MockClass, 'id'> } }>({
        root: '/api',
        port: 1115,
        api: {
          GET: {
            '/:id': createGetEntityEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await new Promise<void>((resolve, reject) => {
        got(`http://127.0.0.1:1115/api/mock`, { method: 'GET' })
          .then(() => reject('Should throw'))
          .catch((err) => {
            const e: HTTPError = err
            expect(e.response.statusCode).toBe(404)
            expect(JSON.parse(e.response.body as string).message).toBe('Entity not found')
            resolve()
          })
      })
    })
  })
})
