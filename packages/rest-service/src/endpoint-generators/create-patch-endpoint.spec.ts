import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { PatchEndpoint } from '@furystack/rest'
import { createPatchEndpoint } from './create-patch-endpoint'
import got from 'got'
import { MockClass, setupContext } from './utils'
import { getRepository } from '@furystack/repository'
import { useRestService } from '../helpers'

describe('createPatchEndpoint', () => {
  it('Should update the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await useRestService<{ PATCH: { '/:id': PatchEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port: 1116,
        api: {
          PATCH: {
            '/:id': createPatchEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await getRepository(i).getDataSetFor(MockClass, 'id').add(i, { id: 'mock', value: 'mock' })

      const countBeforeDelete = await getRepository(i).getDataSetFor(MockClass, 'id').count(i)
      expect(countBeforeDelete).toBe(1)

      const response = await got('http://127.0.0.1:1116/api/mock', {
        method: 'PATCH',
        body: JSON.stringify({ value: 'updated' }),
      })
      expect(response.statusCode).toBe(200)
      expect(response.body).toBe('{}')
      const updated = await getRepository(i).getDataSetFor(MockClass, 'id').get(i, 'mock')
      expect(updated?.value).toBe('updated')
    })
  })
})
