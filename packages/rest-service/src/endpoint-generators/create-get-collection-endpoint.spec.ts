import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import got from 'got'
import { MockClass, setupContext } from './utils'
import { createGetCollectionEndpoint } from './create-get-collection-endpoint'
import { GetCollectionEndpoint, GetCollectionResult, serializeToQueryString } from '@furystack/rest'
import { FindOptions } from '@furystack/core'

const addMockEntities = async (i: Injector) =>
  await i
    .getDataSetFor(MockClass)
    .add(
      i,
      { id: 'mock1', value: '4' },
      { id: 'mock2', value: '3' },
      { id: 'mock3', value: '2' },
      { id: 'mock4', value: '1' },
    )

describe('createGetCollectionEndpoint', () => {
  it('Should return the collection without filter / order', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        root: '/api',
        port: 1112,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass }),
          },
        },
      })
      await addMockEntities(i)

      const count = await i.getDataSetFor(MockClass).count(i)
      const allEntities = await i.getDataSetFor(MockClass).find(i, {})

      const response = await got('http://127.0.0.1:1112/api/entities', { method: 'GET' })
      const json: GetCollectionResult<MockClass> = JSON.parse(response.body)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(allEntities)
    })
  })

  it('Should return entities in order', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = { order: { value: 'ASC' } }
      const count = await i.getDataSetFor(MockClass).count(i, findOptions.filter)
      const orderedEntities = await i.getDataSetFor(MockClass).find(i, findOptions)
      const response = await got(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      const json: GetCollectionResult<MockClass> = JSON.parse(response.body)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(orderedEntities)
    })
  })

  it('Should return entities with filtering', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = {
        filter: { id: { $ne: 'mock2' } },
      }

      const count = await i.getDataSetFor(MockClass).count(i, findOptions.filter)
      const filteredEntities = await i.getDataSetFor(MockClass).find(i, findOptions)

      expect(filteredEntities).not.toContainEqual({ id: 'mock2', value: '3' })

      const response = await got(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      const json: GetCollectionResult<MockClass> = JSON.parse(response.body)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(filteredEntities)
    })
  })

  it('Should return entities with selecting specific fields', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = {
        select: ['id'],
      }

      const count = await i.getDataSetFor(MockClass).count(i, findOptions.filter)
      const selectedEntities = await i.getDataSetFor(MockClass).find(i, findOptions)

      selectedEntities.forEach((e) => expect(e.value).toBeUndefined())

      const response = await got(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      const json: GetCollectionResult<MockClass> = JSON.parse(response.body)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(selectedEntities)
    })
  })

  it('Should return entities with top/skip', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = {
        skip: 1,
        top: 2,
      }

      const count = await i.getDataSetFor(MockClass).count(i, findOptions.filter)
      const topSkipEntities = await i.getDataSetFor(MockClass).find(i, findOptions)

      expect(topSkipEntities).not.toContainEqual({ id: 'mock1', value: '4' })
      expect(topSkipEntities).not.toContainEqual({ id: 'mock4', value: '1' })

      const response = await got(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      const json: GetCollectionResult<MockClass> = JSON.parse(response.body)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(topSkipEntities)
    })
  })
})
