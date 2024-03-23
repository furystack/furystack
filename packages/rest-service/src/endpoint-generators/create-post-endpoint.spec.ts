import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { PostEndpoint } from '@furystack/rest'
import { createPostEndpoint } from './create-post-endpoint.js'
import { MockClass, setupContext } from './utils.js'
import { useRestService } from '../helpers.js'
import { getDataSetFor } from '@furystack/repository'
import { describe, it, expect } from 'vitest'
import { getPort } from '@furystack/core/port-generator'

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
      const response = await fetch('http://127.0.0.1:1117/api', {
        method: 'POST',
        body: JSON.stringify(entityToPost),
      })
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body).toEqual(entityToPost)
      const posted = await getDataSetFor(i, MockClass, 'id').get(i, entityToPost.id)
      expect(posted?.value).toBe('posted')
    })
  })
})
