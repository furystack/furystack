import { getPort } from '@furystack/core/port-generator'
import { createInjector } from '@furystack/inject'
import type { PatchEndpoint } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useRestService } from '../helpers.js'
import { createPatchEndpoint } from './create-patch-endpoint.js'
import type { MockClass } from './utils.js'
import { MockDataSet, setupContext } from './utils.js'

describe('createPatchEndpoint', () => {
  it('updates the entity and responds 200', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupContext(i)
      const port = getPort()
      await useRestService<{ PATCH: { '/:id': PatchEndpoint<MockClass, 'id'> } }>({
        injector: i,
        root: '/api',
        port,
        api: { PATCH: { '/:id': createPatchEndpoint(MockDataSet) } },
      })
      const dataSet = i.get(MockDataSet)
      await dataSet.add(i, { id: 'mock', value: 'mock' })
      expect(await dataSet.count(i)).toBe(1)

      const response = await fetch(`http://127.0.0.1:${port}/api/mock`, {
        method: 'PATCH',
        body: JSON.stringify({ value: 'updated' }),
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({})
      expect((await dataSet.get(i, 'mock'))?.value).toBe('updated')
    })
  })
})
