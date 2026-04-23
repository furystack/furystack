import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { PostEndpoint } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createPostEndpoint } from './create-post-endpoint.js'
import type { MockClass } from './utils.js'
import { MockDataSet, setupContext } from './utils.js'

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
})
