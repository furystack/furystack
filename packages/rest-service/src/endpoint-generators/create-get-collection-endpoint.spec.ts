import type { FindOptions } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { createInjector, type Injector } from '@furystack/inject'
import type { GetCollectionEndpoint, GetCollectionResult } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createGetCollectionEndpoint } from './create-get-collection-endpoint.js'
import type { MockClass } from './utils.js'
import { MockDataSet, setupContext } from './utils.js'

const addMockEntities = async (i: Injector) =>
  i
    .get(MockDataSet)
    .add(
      i,
      { id: 'mock1', value: '4' },
      { id: 'mock2', value: '3' },
      { id: 'mock3', value: '2' },
      { id: 'mock4', value: '1' },
    )

describe('createGetCollectionEndpoint', () => {
  it('returns the collection without filter / order', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/entities': createGetCollectionEndpoint(MockDataSet) } },
      })
      await addMockEntities(i)

      const dataSet = i.get(MockDataSet)
      const count = await dataSet.count(i)
      const allEntities = await dataSet.find(i, {})

      const response = await fetch(`http://127.0.0.1:${port}/api/entities`, { method: 'GET' })
      expect(response.ok).toBe(true)
      const json = (await response.json()) as GetCollectionResult<MockClass>
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(allEntities)
    })
  })

  it('returns entities in the requested order', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/entities': createGetCollectionEndpoint(MockDataSet) } },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = { order: { value: 'ASC' } }
      const dataSet = i.get(MockDataSet)
      const count = await dataSet.count(i, findOptions.filter)
      const orderedEntities = await dataSet.find(i, findOptions)
      const response = await fetch(`http://127.0.0.1:${port}/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.ok).toBe(true)
      const json = (await response.json()) as GetCollectionResult<MockClass>
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(orderedEntities)
    })
  })

  it('applies a supplied filter', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/entities': createGetCollectionEndpoint(MockDataSet) } },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = { filter: { id: { $ne: 'mock2' } } }
      const dataSet = i.get(MockDataSet)
      const count = await dataSet.count(i, findOptions.filter)
      const filteredEntities = await dataSet.find(i, findOptions)

      const response = await fetch(`http://127.0.0.1:${port}/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.ok).toBe(true)
      const json = (await response.json()) as GetCollectionResult<MockClass>
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(filteredEntities)
    })
  })

  it('applies select projection', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/entities': createGetCollectionEndpoint(MockDataSet) } },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = { select: ['id'] }
      const dataSet = i.get(MockDataSet)
      const count = await dataSet.count(i, findOptions.filter)
      const selected = await dataSet.find(i, findOptions)

      const response = await fetch(`http://127.0.0.1:${port}/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.ok).toBe(true)
      const json = (await response.json()) as GetCollectionResult<MockClass>
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(selected)
    })
  })

  it('honours top/skip', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port,
        api: { GET: { '/entities': createGetCollectionEndpoint(MockDataSet) } },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = { skip: 1, top: 2 }
      const dataSet = i.get(MockDataSet)
      const count = await dataSet.count(i, findOptions.filter)
      const page = await dataSet.find(i, findOptions)

      const response = await fetch(`http://127.0.0.1:${port}/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.status).toBe(200)
      const json = (await response.json()) as GetCollectionResult<MockClass>
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(page)
    })
  })
})
