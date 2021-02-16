import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { PostEndpoint } from '@furystack/rest'
import { createPostEndpoint } from './create-post-endpoint'
import got from 'got'
import { MockClass, setupContext } from './utils'

describe('createPostEndpoint', () => {
  it('Should create the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ POST: { '/:id': PostEndpoint<MockClass> } }>({
        root: '/api',
        port: 1117,
        api: {
          POST: {
            '/:id': createPostEndpoint({ model: MockClass }),
          },
        },
      })
      const entityToPost = { id: 'mock', value: 'posted' }
      const response = await got('http://127.0.0.1:1117/api/mock', {
        method: 'POST',
        body: JSON.stringify(entityToPost),
      })
      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body)).toStrictEqual(entityToPost)
      const posted = await i.getDataSetFor(MockClass).get(i, entityToPost.id)
      expect(posted?.value).toBe('posted')
    })
  })
})
