import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { PostEndpoint } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createPostEndpoint } from './create-post-endpoint.js'
import type { MockClass } from './utils.js'
import { MockDataSet, MockStore, setupContext } from './utils.js'

describe('createPostEndpoint', () => {
  it('creates the entity and responds 201', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ POST: { '/': PostEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { POST: { '/': createPostEndpoint(MockDataSet) } },
      })
      const entityToPost = { id: 'mock', value: 'posted' }
      const response = await fetch(`http://127.0.0.1:${port}/api`, {
        method: 'POST',
        body: JSON.stringify(entityToPost),
      })
      expect(response.status).toBe(201)
      expect(await response.json()).toEqual(entityToPost)
      expect((await i.get(MockDataSet).get(i, entityToPost.id))?.value).toBe('posted')
    })
  })

  it('responds 404 when the underlying data set returned no created entity', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      // Swap the dataset binding for a stub whose `add` comes back empty --
      // this is the only way to exercise the `!created.length` branch.
      i.bind(MockDataSet, () => ({ add: async () => ({ created: [] as MockClass[] }) }) as never)
      const port = getPort()
      await useRestService<{ POST: { '/': PostEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { POST: { '/': createPostEndpoint(MockDataSet) } },
      })
      const response = await fetch(`http://127.0.0.1:${port}/api`, {
        method: 'POST',
        body: JSON.stringify({ id: 'mock', value: 'x' }),
      })
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ message: 'Entity not found' })
    })
  })
})

describe('endpoint-generators/utils', () => {
  it('MockStore throws from its default factory when setupContext was not called', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(() => i.get(MockStore)).toThrow(/MockStore is not configured/)
    })
  })

  it('setupContext binds MockStore in-memory so the default factory is bypassed', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      expect(i.get(MockStore)).toBeDefined()
    })
  })
})
