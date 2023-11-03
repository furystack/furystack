import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { PatchEndpoint } from '@furystack/rest'
import { createPatchEndpoint } from './create-patch-endpoint.js'
import { MockClass, setupContext } from './utils.js'
import { getDataSetFor } from '@furystack/repository'
import { useRestService } from '../helpers.js'
import { describe, it, expect } from 'vitest'

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
      await getDataSetFor(i, MockClass, 'id').add(i, { id: 'mock', value: 'mock' })

      const countBeforeDelete = await getDataSetFor(i, MockClass, 'id').count(i)
      expect(countBeforeDelete).toBe(1)

      const response = await fetch('http://127.0.0.1:1116/api/mock', {
        method: 'PATCH',
        body: JSON.stringify({ value: 'updated' }),
      })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({})
      const updated = await getDataSetFor(i, MockClass, 'id').get(i, 'mock')
      expect(updated?.value).toBe('updated')
    })
  })
})
