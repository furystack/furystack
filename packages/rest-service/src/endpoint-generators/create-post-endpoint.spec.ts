import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import type { PostEndpoint } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createPostEndpoint } from './create-post-endpoint.js'
import { MockClass, setupContext } from './utils.js'

describe('createPostEndpoint', () => {
  it('Should create the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ POST: { '/': PostEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: {
          POST: {
            '/': createPostEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const entityToPost = { id: 'mock', value: 'posted' }
      const response = await fetch(`http://127.0.0.1:${port}/api`, {
        method: 'POST',
        body: JSON.stringify(entityToPost),
      })
      expect(response.status).toBe(201)
      const body = (await response.json()) as { id: string; value: string }
      expect(body).toEqual(entityToPost)
      const posted = await getDataSetFor(i, MockClass, 'id').get(i, entityToPost.id)
      expect(posted?.value).toBe('posted')
    })
  })
})
