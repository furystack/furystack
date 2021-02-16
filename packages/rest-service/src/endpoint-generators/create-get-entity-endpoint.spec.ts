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
      await i.useRestService<{ '/:id': { GET: GetEntityEndpoint<MockClass> } }>({
        root: '/api',
        port: 1113,
        api: {
          '/:id': { GET: createGetEntityEndpoint({ model: MockClass }) },
        },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await i.getDataSetFor(MockClass).add(i, mockEntity)

      const response = await got('http://127.0.0.1:1113/api/mock', { method: 'GET' })
      expect(JSON.parse(response.body)).toStrictEqual(mockEntity)
    })
  })

  it('Should return the entity with the selected fields', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ '/:id': { GET: GetEntityEndpoint<MockClass> } }>({
        root: '/api',
        port: 1114,
        api: {
          '/:id': { GET: createGetEntityEndpoint({ model: MockClass }) },
        },
      })
      const mockEntity: MockClass = { id: 'mock', value: 'mock' }
      await i.getDataSetFor(MockClass).add(i, mockEntity)

      const response = await got(`http://127.0.0.1:1114/api/mock?${serializeToQueryString({ select: ['id'] })}`, {
        method: 'GET',
      })
      expect(JSON.parse(response.body)).toStrictEqual({ id: mockEntity.id })
    })
  })

  it('Should return 404 if no entity has been found', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ '/:id': { GET: GetEntityEndpoint<MockClass> } }>({
        root: '/api',
        port: 1115,
        api: {
          '/:id': { GET: createGetEntityEndpoint({ model: MockClass }) },
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
