import { describe, expect, it } from 'vitest'
import type { RestApiImplementation } from './api-manager.js'
import { defaultSchema, getApiFromSchema } from './get-schema-from-api.js'
import { JsonResult, type RequestAction } from './request-action-implementation.js'
import validationSchema from './validate.integration.spec.schema.json' with { type: 'json' }
import { Validate } from './validate.js'

const ExampleAction: RequestAction<any> = async () => {
  return JsonResult({ success: true })
}

describe('getSchemaFromApi', () => {
  it('Should return the default schema from the API', () => {
    const Api = {
      GET: {
        '/example': ExampleAction,
      },
    } as const satisfies RestApiImplementation<any>

    const schema = getApiFromSchema(Api)
    expect(schema).toEqual({
      '/example': {
        path: '/example',
        method: 'GET',
        schema: defaultSchema,
        schemaName: 'default',
      },
    })
  })

  it('Should return the attached schema from the validation', () => {
    const Api = {
      GET: {
        '/validate-query': Validate({
          schema: validationSchema,
          schemaName: 'ValidateQuery',
        })(async () => JsonResult({ success: true })),
      },
    } as const satisfies RestApiImplementation<any>

    const schema = getApiFromSchema(Api)
    expect(schema).toEqual({
      '/validate-query': {
        path: '/validate-query',
        method: 'GET',
        schema: validationSchema,
        schemaName: 'ValidateQuery',
      },
    })
  })
})
