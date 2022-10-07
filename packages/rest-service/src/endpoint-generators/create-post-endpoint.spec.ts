import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { PostEndpoint } from '@furystack/rest'
import { createPostEndpoint } from './create-post-endpoint.js'
import got from 'got'
import { MockClass, setupContext } from './utils.js'
import { useRestService } from '../helpers.js'
import { getDataSetFor } from '@furystack/repository'
import { describe, expect, it } from 'vitest'

describe('createPostEndpoint', () => {
  it('Should create the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ POST: { '/:id': PostEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1117,
        api: {
          POST: {
            '/:id': createPostEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      const entityToPost = { id: 'mock', value: 'posted' }
      const response = await got.default('http://127.0.0.1:1117/api/mock', {
        method: 'POST',
        body: JSON.stringify(entityToPost),
      })
      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body)).toStrictEqual(entityToPost)
      const posted = await getDataSetFor(i, MockClass, 'id').get(i, entityToPost.id)
      expect(posted?.value).toBe('posted')
    })
  })
})
