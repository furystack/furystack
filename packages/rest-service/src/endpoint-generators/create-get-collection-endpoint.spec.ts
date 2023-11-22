import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { MockClass, setupContext } from './utils.js'
import { createGetCollectionEndpoint } from './create-get-collection-endpoint.js'
import type { GetCollectionEndpoint, GetCollectionResult } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import type { FindOptions } from '@furystack/core'
import { getDataSetFor, getRepository } from '@furystack/repository'
import { useRestService } from '../helpers.js'
import { describe, it, expect } from 'vitest'

const addMockEntities = async (i: Injector) =>
  await getRepository(i)
    .getDataSetFor(MockClass, 'id')
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
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port: 1112,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await addMockEntities(i)

      const count = await getDataSetFor(i, MockClass, 'id').count(i)
      const allEntities = await getDataSetFor(i, MockClass, 'id').find(i, {})

      const response = await fetch('http://127.0.0.1:1112/api/entities', { method: 'GET' })
      expect(response.ok).toBe(true)
      const json: GetCollectionResult<MockClass> = await response.json()
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(allEntities)
    })
  })

  it('Should return entities in order', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = { order: { value: 'ASC' } }
      const count = await getDataSetFor(i, MockClass, 'id').count(i, findOptions.filter)
      const orderedEntities = await getDataSetFor(i, MockClass, 'id').find(i, findOptions)
      const response = await fetch(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.ok).toBe(true)
      const json: GetCollectionResult<MockClass> = await response.json()
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(orderedEntities)
    })
  })

  it('Should return entities with filtering', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = {
        filter: { id: { $ne: 'mock2' } },
      }

      const count = await getDataSetFor(i, MockClass, 'id').count(i, findOptions.filter)
      const filteredEntities = await getDataSetFor(i, MockClass, 'id').find(i, findOptions)

      expect(filteredEntities).not.toContainEqual({ id: 'mock2', value: '3' })

      const response = await fetch(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.ok).toBe(true)
      const json: GetCollectionResult<MockClass> = await response.json()
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(filteredEntities)
    })
  })

  it('Should return entities with selecting specific fields', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = {
        select: ['id'],
      }

      const count = await getDataSetFor(i, MockClass, 'id').count(i, findOptions.filter)
      const selectedEntities = await getDataSetFor(i, MockClass, 'id').find(i, findOptions)

      selectedEntities.forEach((e) => expect(e.value).toBeUndefined())

      const response = await fetch(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })

      expect(response.ok).toBe(true)
      const json: GetCollectionResult<MockClass> = await response.json()
      expect(response.status).toBe(200)
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(selectedEntities)
    })
  })

  it('Should return entities with top/skip', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ GET: { '/entities': GetCollectionEndpoint<MockClass> } }>({
        injector: i,
        root: '/api',
        port: 1113,
        api: {
          GET: {
            '/entities': createGetCollectionEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await addMockEntities(i)
      const findOptions: FindOptions<MockClass, Array<keyof MockClass>> = {
        skip: 1,
        top: 2,
      }

      const count = await getDataSetFor(i, MockClass, 'id').count(i, findOptions.filter)
      const topSkipEntities = await getDataSetFor(i, MockClass, 'id').find(i, findOptions)

      expect(topSkipEntities).not.toContainEqual({ id: 'mock1', value: '4' })
      expect(topSkipEntities).not.toContainEqual({ id: 'mock4', value: '1' })

      const response = await fetch(`http://127.0.0.1:1113/api/entities?${serializeToQueryString({ findOptions })}`, {
        method: 'GET',
      })
      expect(response.status).toBe(200)
      const json: GetCollectionResult<MockClass> = await response.json()
      expect(json.count).toBe(count)
      expect(json.entries).toEqual(topSkipEntities)
    })
  })
})
