import { Injector } from '@furystack/inject'
import { RestApi } from '@furystack/rest'
import { createClient } from '@furystack/rest-client-got'
import { usingAsync } from '@furystack/utils'
import { RequestError } from 'got/dist/source'
import { JsonResult } from './request-action-implementation'
import { Validate } from './validate'
import './injector-extensions'

import schema from './validate.integration.spec.schema.json'

// To recreate: yarn ts-json-schema-generator -f tsconfig.json -p packages/rest-service/src/validate.integration.spec.ts -t ValidationApi -e none -o packages/rest-service/src/validate.integration.spec.schema.json

export interface ValidateQuery {
  query: { foo: string; bar: number; baz: boolean }
  result: {}
}
export interface ValidateUrl {
  urlParams: { id: number }
  result: {}
}
export interface ValidateHeaders {
  headers: { foo: string; bar: number; baz: boolean }
  result: {}
}
export interface ValidateBody {
  body: { foo: string; bar: number; baz: boolean }
  result: {}
}

export interface ValidationApi extends RestApi {
  GET: {
    '/validate-query': ValidateQuery
    // '/validate-url/:id': ValidateUrl
    // '/validate-headers': ValidateHeaders
  }
  // POST: {
  //   '/validate-body': ValidateBody
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
          schemaName: 'ValidateQuery',
        })(async () => JsonResult({})),
      },
    },
    port,
    root: '/api',
  })
  const client = createClient<ValidationApi>({
    endpointUrl: `http://localhost:${port}/api`,
  })
  return {
    dispose: injector.dispose.bind(injector),
    client,
  }
}

describe('Validation integration tests', () => {
  it('Should validate query', async () => {
    await usingAsync(await createValidateApi(), async ({ client }) => {
      expect.assertions(3)
      try {
        await client({
          method: 'GET',
          action: '/validate-query',
          query: undefined as any,
        })
      } catch (error) {
        if (error instanceof RequestError) {
          expect(error.message).toBe('Response code 400 (Bad Request)')
          expect(error.response?.statusCode).toBe(400)
          const responseJson = JSON.parse(error.response?.body as string)
          expect(responseJson.errors[0].params.missingProperty).toEqual('query')
        }
      }
    })
  })
  it.todo('Should validate url')
  it.todo('Should validate headers')
  it.todo('Should validate body')
})
