import { Injector } from '@furystack/inject'
import { RequestAction, RestApi } from '@furystack/rest'
import { createClient } from '@furystack/rest-client-got'
import { usingAsync } from '@furystack/utils'
import { RequestError } from 'got/dist/source'
import { JsonResult } from 'request-action-implementation'
import { Validate } from './validate'

import schema from './validate.integration.spec.schema.json'

export interface ValidationApi extends RestApi {
  GET: {
    '/validate-query': RequestAction<{ query: { foo: string; bar: number; baz: boolean }; result: {} }>
    // '/validate-url/:id': RequestAction<{ urlParams: { id: number }; result: {} }>
    // '/validate-headers': RequestAction<{ headers: { foo: string; bar: number; baz: boolean }; result: {} }>
  }
  // POST: {
  //   '/validate-body': RequestAction<{ body: { foo: string; bar: number; baz: boolean }; result: {} }>
  // }
}

export const createValidateApi = async () => {
  const injector = new Injector()
  const port = Math.round(Math.random() * 1000) + 1000
  injector.useRestService<ValidationApi>({
    api: {
      GET: {
        '/validate-query': Validate({
          schema,
          schemaName: 'RequestAction<Query>',
        })(async () => JsonResult({})),
      },
    },
    port,
    root: '/',
  })
  const client = createClient<ValidationApi>({
    endpointUrl: `http://localhost:${port}`,
  })
  return {
    dispose: injector.dispose.bind(injector),
    client,
  }
}

describe('Validation integration tests', () => {
  it('Should validate query', async () => {
    await usingAsync(await createValidateApi(), async ({ client }) => {
      expect.assertions(2)
      try {
        await client({
          method: 'GET',
          action: '/validate-query',
          query: undefined as any,
        })
      } catch (error) {
        if (error instanceof RequestError) {
          expect(error.message).toBe('')
        }
      }
    })
  })
  it.todo('Should validate url')
  it.todo('Should validate headers')
  it.todo('Should validate body')
})
