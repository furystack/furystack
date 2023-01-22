import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { PostEndpoint } from '@furystack/rest'
import { createPostEndpoint } from './create-post-endpoint'
import { MockClass, setupContext } from './utils'
import { useRestService } from '../helpers'
import { getDataSetFor } from '@furystack/repository'

describe('createPostEndpoint', () => {
  it('Should create the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ POST: { '/': PostEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1121,
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
