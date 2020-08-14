import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { DeleteEndpoint } from '@furystack/rest'
import { createDeleteEndpoint } from './create-delete-endpoint'
import got from 'got'
import { MockClass, setupContext } from './utils'

describe('createDeleteEndpoint', () => {
  it('Should delete the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      await i.useRestService<{ DELETE: { '/:id': DeleteEndpoint<MockClass> } }>({
        root: '/api',
        port: 1111,
        api: {
          DELETE: {
            '/:id': createDeleteEndpoint({ model: MockClass }),
          },
        },
      })
      await i.getDataSetFor(MockClass).add(i, { id: 'mock', value: 'mock' })

      const countBeforeDelete = await i.getDataSetFor(MockClass).count(i)
      expect(countBeforeDelete).toBe(1)

      const response = await got('http://127.0.0.1:1111/api/mock', { method: 'DELETE' })
      expect(response.statusCode).toBe(204)
      expect(response.body).toBe('')

      const countAfterDelete = await i.getDataSetFor(MockClass).count(i)
      expect(countAfterDelete).toBe(0)
    })
  })
})
