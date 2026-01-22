import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import type { PatchEndpoint } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createPatchEndpoint } from './create-patch-endpoint.js'
import { MockClass, setupContext } from './utils.js'

describe('createPatchEndpoint', () => {
  it('Should update the entity and report the success', async () => {
    await usingAsync(new Injector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ PATCH: { '/:id': PatchEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: {
          PATCH: {
            '/:id': createPatchEndpoint({ model: MockClass, primaryKey: 'id' }),
          },
        },
      })
      await getDataSetFor(i, MockClass, 'id').add(i, { id: 'mock', value: 'mock' })

      const countBeforeDelete = await getDataSetFor(i, MockClass, 'id').count(i)
      expect(countBeforeDelete).toBe(1)

      const response = await fetch(`http://127.0.0.1:${port}/api/mock`, {
        method: 'PATCH',
        body: JSON.stringify({ value: 'updated' }),
      })
      expect(response.status).toBe(200)
      const body = (await response.json()) as { value: string }
      expect(body).toEqual({})
      const updated = await getDataSetFor(i, MockClass, 'id').get(i, 'mock')
      expect(updated?.value).toBe('updated')
    })
  })
})
