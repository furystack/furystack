import { getStoreManager, InMemoryStore, User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import type { WithSchemaAction } from '@furystack/rest'
import { createClient, ResponseError } from '@furystack/rest-client-fetch'
import { usingAsync } from '@furystack/utils'
import type Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import { useRestService } from './helpers.js'
import { DefaultSession } from './models/default-session.js'
import { JsonResult } from './request-action-implementation.js'
import type { ValidationApi } from './validate.integration.schema.js'
import schema from './validate.integration.spec.schema.json' with { type: 'json' }
import { Validate } from './validate.js'

// To recreate: yarn ts-json-schema-generator -f tsconfig.json --no-type-check -p packages/rest-service/src/validate.integration.schema.ts -o packages/rest-service/src/validate.integration.spec.schema.json

const createValidateApi = async (options = { enableGetSchema: false }) => {
  const injector = new Injector()
  const port = getPort()

  getStoreManager(injector).addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
  getStoreManager(injector).addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))

  const api = await useRestService<ValidationApi>({
    injector,
    enableGetSchema: options.enableGetSchema,
    api: {
      GET: {
        '/validate-query': Validate({
          schema,
          schemaName: 'ValidateQuery',
        })(async ({ getQuery }) => JsonResult({ ...getQuery() })),
        '/validate-url/:id': Validate({
          schema,
          schemaName: 'ValidateUrl',
        })(async ({ getUrlParams }) => JsonResult({ ...getUrlParams() })),
        '/validate-headers': Validate({
          schema,
          schemaName: 'ValidateHeaders',
        })(async ({ headers }) => JsonResult({ ...headers })),
        '/mock': undefined as any, // ToDo: Generator and test
        '/mock/:id': undefined as any, // ToDo: Generator and test
      },
      POST: {
        '/validate-body': Validate({
          schema,
          schemaName: 'ValidateBody',
        })(async ({ getBody }) => {
          const body = await getBody()
          return JsonResult({ ...body })
        }),
        '/mock': undefined as any, // ToDo: Generator and test
      },
      PATCH: {
        '/mock/:id': undefined as any, // ToDo: Generator and test
      },
      DELETE: {
        '/mock/:id': undefined as any, // ToDo: Generator and test
      },
    },
    port,
    root: '/api',
  })
  const client = createClient<ValidationApi>({
    endpointUrl: `http://127.0.0.1:${port}/api`,
  })

  return {
    [Symbol.asyncDispose]: injector[Symbol.asyncDispose].bind(injector),
    injector,
    api,
    client,
  }
}

describe('Validation integration tests', () => {
  describe('Validation metadata', () => {
    it('Should return 404 when not enabled', async () => {
      await usingAsync(await createValidateApi({ enableGetSchema: false }), async ({ client }) => {
        try {
          await (client as ReturnType<typeof createClient<WithSchemaAction<ValidationApi>>>)({
            method: 'GET',
            action: '/schema',
            headers: {
              accept: 'application/schema+json',
            },
          })
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseError)
          expect((error as ResponseError).response.status).toBe(404)
        }
      })
    })

    it('Should return a 406 when the accept header is not supported', async () => {
      expect.assertions(2)
      await usingAsync(await createValidateApi({ enableGetSchema: true }), async ({ client }) => {
        try {
          await (client as ReturnType<typeof createClient<WithSchemaAction<ValidationApi>>>)({
            method: 'GET',
            action: '/schema',
            headers: {
              accept: 'text/plain' as any,
            },
          })
        } catch (error) {
          expect(error).toBeInstanceOf(ResponseError)
          expect((error as ResponseError).response.status).toBe(406)
        }
      })
    })

    it('Should return the validation metadata', async () => {
      await usingAsync(await createValidateApi({ enableGetSchema: true }), async ({ client }) => {
        const result = await (client as ReturnType<typeof createClient<WithSchemaAction<ValidationApi>>>)({
          method: 'GET',
          action: '/schema',
          headers: {
            accept: 'application/schema+json',
          },
        })

        expect(result.response.status).toBe(200)
        expect(result.result).toMatchInlineSnapshot(`
          {
            "/validate-body": {
              "method": "POST",
              "path": "/validate-body",
              "schema": {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "definitions": {
                  "DeleteEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for deleting entities",
                    "properties": {
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "FilterType<Mock>": {
                    "additionalProperties": true,
                    "properties": {
                      "$and": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$nor": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$not": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$or": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "id": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                      "value": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                    },
                    "type": "object",
                  },
                  "FindOptions<Mock,("id"|"value")[]>": {
                    "additionalProperties": true,
                    "description": "Type for default filtering model",
                    "properties": {
                      "filter": {
                        "$ref": "#/definitions/FilterType%3CMock%3E",
                        "description": "The fields should match this filter",
                      },
                      "order": {
                        "additionalProperties": false,
                        "description": "Sets up an order by a field and a direction",
                        "properties": {
                          "id": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                          "value": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "select": {
                        "description": "The result set will be limited to these fields",
                        "items": {
                          "enum": [
                            "id",
                            "value",
                          ],
                          "type": "string",
                        },
                        "type": "array",
                      },
                      "skip": {
                        "description": "Skips the first N hit",
                        "type": "number",
                      },
                      "top": {
                        "description": "Limits the hits",
                        "type": "number",
                      },
                    },
                    "type": "object",
                  },
                  "GetCollectionEndpoint<Mock>": {
                    "additionalProperties": true,
                    "description": "Rest endpoint model for getting / querying collections",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "findOptions": {
                            "$ref": "#/definitions/FindOptions%3CMock%2C(%22id%22%7C%22value%22)%5B%5D%3E",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/GetCollectionResult%3CMock%3E",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "GetCollectionResult<Mock>": {
                    "additionalProperties": true,
                    "description": "Response Model for GetCollection",
                    "properties": {
                      "count": {
                        "description": "The Total count of entities",
                        "type": "number",
                      },
                      "entries": {
                        "description": "List of the selected entities",
                        "items": {
                          "$ref": "#/definitions/Mock",
                        },
                        "type": "array",
                      },
                    },
                    "required": [
                      "count",
                      "entries",
                    ],
                    "type": "object",
                  },
                  "GetEntityEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for getting a single entity",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "select": {
                            "description": "The list of fields to select",
                            "items": {
                              "enum": [
                                "id",
                                "value",
                              ],
                              "type": "string",
                            },
                            "type": "array",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "description": "The entity's unique identifier",
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                      "url",
                    ],
                    "type": "object",
                  },
                  "Mock": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "id",
                      "value",
                    ],
                    "type": "object",
                  },
                  "PatchEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for updating entities",
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                          "value": {
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                      "url",
                    ],
                    "type": "object",
                  },
                  "PostEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for creating new entities",
                    "properties": {
                      "body": {
                        "$ref": "#/definitions/WithOptionalId%3CMock%2C%22id%22%3E",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "RestApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "type": "object",
                  },
                  "ValidateBody": {
                    "additionalProperties": true,
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "ValidateHeaders": {
                    "additionalProperties": true,
                    "properties": {
                      "headers": {
                        "additionalProperties": true,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "headers",
                    ],
                    "type": "object",
                  },
                  "ValidateQuery": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "ValidateUrl": {
                    "additionalProperties": true,
                    "properties": {
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "ValidationApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/DeleteEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/GetCollectionEndpoint%3CMock%3E",
                          },
                          "/mock/:id": {
                            "$ref": "#/definitions/GetEntityEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-headers": {
                            "$ref": "#/definitions/ValidateHeaders",
                          },
                          "/validate-query": {
                            "$ref": "#/definitions/ValidateQuery",
                          },
                          "/validate-url/:id": {
                            "$ref": "#/definitions/ValidateUrl",
                          },
                        },
                        "required": [
                          "/validate-query",
                          "/validate-url/:id",
                          "/validate-headers",
                          "/mock",
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/PatchEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/PostEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-body": {
                            "$ref": "#/definitions/ValidateBody",
                          },
                        },
                        "required": [
                          "/validate-body",
                          "/mock",
                        ],
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "required": [
                      "GET",
                      "POST",
                      "PATCH",
                      "DELETE",
                    ],
                    "type": "object",
                  },
                  "WithOptionalId<Mock,"id">": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "value",
                    ],
                    "type": "object",
                  },
                },
              },
              "schemaName": "ValidateBody",
            },
            "/validate-headers": {
              "method": "GET",
              "path": "/validate-headers",
              "schema": {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "definitions": {
                  "DeleteEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for deleting entities",
                    "properties": {
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "FilterType<Mock>": {
                    "additionalProperties": true,
                    "properties": {
                      "$and": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$nor": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$not": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$or": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "id": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                      "value": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                    },
                    "type": "object",
                  },
                  "FindOptions<Mock,("id"|"value")[]>": {
                    "additionalProperties": true,
                    "description": "Type for default filtering model",
                    "properties": {
                      "filter": {
                        "$ref": "#/definitions/FilterType%3CMock%3E",
                        "description": "The fields should match this filter",
                      },
                      "order": {
                        "additionalProperties": false,
                        "description": "Sets up an order by a field and a direction",
                        "properties": {
                          "id": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                          "value": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "select": {
                        "description": "The result set will be limited to these fields",
                        "items": {
                          "enum": [
                            "id",
                            "value",
                          ],
                          "type": "string",
                        },
                        "type": "array",
                      },
                      "skip": {
                        "description": "Skips the first N hit",
                        "type": "number",
                      },
                      "top": {
                        "description": "Limits the hits",
                        "type": "number",
                      },
                    },
                    "type": "object",
                  },
                  "GetCollectionEndpoint<Mock>": {
                    "additionalProperties": true,
                    "description": "Rest endpoint model for getting / querying collections",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "findOptions": {
                            "$ref": "#/definitions/FindOptions%3CMock%2C(%22id%22%7C%22value%22)%5B%5D%3E",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/GetCollectionResult%3CMock%3E",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "GetCollectionResult<Mock>": {
                    "additionalProperties": true,
                    "description": "Response Model for GetCollection",
                    "properties": {
                      "count": {
                        "description": "The Total count of entities",
                        "type": "number",
                      },
                      "entries": {
                        "description": "List of the selected entities",
                        "items": {
                          "$ref": "#/definitions/Mock",
                        },
                        "type": "array",
                      },
                    },
                    "required": [
                      "count",
                      "entries",
                    ],
                    "type": "object",
                  },
                  "GetEntityEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for getting a single entity",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "select": {
                            "description": "The list of fields to select",
                            "items": {
                              "enum": [
                                "id",
                                "value",
                              ],
                              "type": "string",
                            },
                            "type": "array",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "description": "The entity's unique identifier",
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                      "url",
                    ],
                    "type": "object",
                  },
                  "Mock": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "id",
                      "value",
                    ],
                    "type": "object",
                  },
                  "PatchEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for updating entities",
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                          "value": {
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                      "url",
                    ],
                    "type": "object",
                  },
                  "PostEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for creating new entities",
                    "properties": {
                      "body": {
                        "$ref": "#/definitions/WithOptionalId%3CMock%2C%22id%22%3E",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "RestApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "type": "object",
                  },
                  "ValidateBody": {
                    "additionalProperties": true,
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "ValidateHeaders": {
                    "additionalProperties": true,
                    "properties": {
                      "headers": {
                        "additionalProperties": true,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "headers",
                    ],
                    "type": "object",
                  },
                  "ValidateQuery": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "ValidateUrl": {
                    "additionalProperties": true,
                    "properties": {
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "ValidationApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/DeleteEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/GetCollectionEndpoint%3CMock%3E",
                          },
                          "/mock/:id": {
                            "$ref": "#/definitions/GetEntityEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-headers": {
                            "$ref": "#/definitions/ValidateHeaders",
                          },
                          "/validate-query": {
                            "$ref": "#/definitions/ValidateQuery",
                          },
                          "/validate-url/:id": {
                            "$ref": "#/definitions/ValidateUrl",
                          },
                        },
                        "required": [
                          "/validate-query",
                          "/validate-url/:id",
                          "/validate-headers",
                          "/mock",
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/PatchEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/PostEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-body": {
                            "$ref": "#/definitions/ValidateBody",
                          },
                        },
                        "required": [
                          "/validate-body",
                          "/mock",
                        ],
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "required": [
                      "GET",
                      "POST",
                      "PATCH",
                      "DELETE",
                    ],
                    "type": "object",
                  },
                  "WithOptionalId<Mock,"id">": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "value",
                    ],
                    "type": "object",
                  },
                },
              },
              "schemaName": "ValidateHeaders",
            },
            "/validate-query": {
              "method": "GET",
              "path": "/validate-query",
              "schema": {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "definitions": {
                  "DeleteEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for deleting entities",
                    "properties": {
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "FilterType<Mock>": {
                    "additionalProperties": true,
                    "properties": {
                      "$and": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$nor": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$not": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$or": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "id": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                      "value": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                    },
                    "type": "object",
                  },
                  "FindOptions<Mock,("id"|"value")[]>": {
                    "additionalProperties": true,
                    "description": "Type for default filtering model",
                    "properties": {
                      "filter": {
                        "$ref": "#/definitions/FilterType%3CMock%3E",
                        "description": "The fields should match this filter",
                      },
                      "order": {
                        "additionalProperties": false,
                        "description": "Sets up an order by a field and a direction",
                        "properties": {
                          "id": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                          "value": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "select": {
                        "description": "The result set will be limited to these fields",
                        "items": {
                          "enum": [
                            "id",
                            "value",
                          ],
                          "type": "string",
                        },
                        "type": "array",
                      },
                      "skip": {
                        "description": "Skips the first N hit",
                        "type": "number",
                      },
                      "top": {
                        "description": "Limits the hits",
                        "type": "number",
                      },
                    },
                    "type": "object",
                  },
                  "GetCollectionEndpoint<Mock>": {
                    "additionalProperties": true,
                    "description": "Rest endpoint model for getting / querying collections",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "findOptions": {
                            "$ref": "#/definitions/FindOptions%3CMock%2C(%22id%22%7C%22value%22)%5B%5D%3E",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/GetCollectionResult%3CMock%3E",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "GetCollectionResult<Mock>": {
                    "additionalProperties": true,
                    "description": "Response Model for GetCollection",
                    "properties": {
                      "count": {
                        "description": "The Total count of entities",
                        "type": "number",
                      },
                      "entries": {
                        "description": "List of the selected entities",
                        "items": {
                          "$ref": "#/definitions/Mock",
                        },
                        "type": "array",
                      },
                    },
                    "required": [
                      "count",
                      "entries",
                    ],
                    "type": "object",
                  },
                  "GetEntityEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for getting a single entity",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "select": {
                            "description": "The list of fields to select",
                            "items": {
                              "enum": [
                                "id",
                                "value",
                              ],
                              "type": "string",
                            },
                            "type": "array",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "description": "The entity's unique identifier",
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                      "url",
                    ],
                    "type": "object",
                  },
                  "Mock": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "id",
                      "value",
                    ],
                    "type": "object",
                  },
                  "PatchEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for updating entities",
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                          "value": {
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                      "url",
                    ],
                    "type": "object",
                  },
                  "PostEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for creating new entities",
                    "properties": {
                      "body": {
                        "$ref": "#/definitions/WithOptionalId%3CMock%2C%22id%22%3E",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "RestApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "type": "object",
                  },
                  "ValidateBody": {
                    "additionalProperties": true,
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "ValidateHeaders": {
                    "additionalProperties": true,
                    "properties": {
                      "headers": {
                        "additionalProperties": true,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "headers",
                    ],
                    "type": "object",
                  },
                  "ValidateQuery": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "ValidateUrl": {
                    "additionalProperties": true,
                    "properties": {
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "ValidationApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/DeleteEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/GetCollectionEndpoint%3CMock%3E",
                          },
                          "/mock/:id": {
                            "$ref": "#/definitions/GetEntityEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-headers": {
                            "$ref": "#/definitions/ValidateHeaders",
                          },
                          "/validate-query": {
                            "$ref": "#/definitions/ValidateQuery",
                          },
                          "/validate-url/:id": {
                            "$ref": "#/definitions/ValidateUrl",
                          },
                        },
                        "required": [
                          "/validate-query",
                          "/validate-url/:id",
                          "/validate-headers",
                          "/mock",
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/PatchEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/PostEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-body": {
                            "$ref": "#/definitions/ValidateBody",
                          },
                        },
                        "required": [
                          "/validate-body",
                          "/mock",
                        ],
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "required": [
                      "GET",
                      "POST",
                      "PATCH",
                      "DELETE",
                    ],
                    "type": "object",
                  },
                  "WithOptionalId<Mock,"id">": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "value",
                    ],
                    "type": "object",
                  },
                },
              },
              "schemaName": "ValidateQuery",
            },
            "/validate-url/:id": {
              "method": "GET",
              "path": "/validate-url/:id",
              "schema": {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "definitions": {
                  "DeleteEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for deleting entities",
                    "properties": {
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "FilterType<Mock>": {
                    "additionalProperties": true,
                    "properties": {
                      "$and": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$nor": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$not": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "$or": {
                        "items": {
                          "$ref": "#/definitions/FilterType%3CMock%3E",
                        },
                        "type": "array",
                      },
                      "id": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                      "value": {
                        "anyOf": [
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$endsWith": {
                                "type": "string",
                              },
                              "$like": {
                                "type": "string",
                              },
                              "$regex": {
                                "type": "string",
                              },
                              "$startsWith": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$eq": {
                                "type": "string",
                              },
                              "$ne": {
                                "type": "string",
                              },
                            },
                            "type": "object",
                          },
                          {
                            "additionalProperties": false,
                            "properties": {
                              "$in": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                              "$nin": {
                                "items": {
                                  "type": "string",
                                },
                                "type": "array",
                              },
                            },
                            "type": "object",
                          },
                        ],
                      },
                    },
                    "type": "object",
                  },
                  "FindOptions<Mock,("id"|"value")[]>": {
                    "additionalProperties": true,
                    "description": "Type for default filtering model",
                    "properties": {
                      "filter": {
                        "$ref": "#/definitions/FilterType%3CMock%3E",
                        "description": "The fields should match this filter",
                      },
                      "order": {
                        "additionalProperties": false,
                        "description": "Sets up an order by a field and a direction",
                        "properties": {
                          "id": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                          "value": {
                            "enum": [
                              "ASC",
                              "DESC",
                            ],
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "select": {
                        "description": "The result set will be limited to these fields",
                        "items": {
                          "enum": [
                            "id",
                            "value",
                          ],
                          "type": "string",
                        },
                        "type": "array",
                      },
                      "skip": {
                        "description": "Skips the first N hit",
                        "type": "number",
                      },
                      "top": {
                        "description": "Limits the hits",
                        "type": "number",
                      },
                    },
                    "type": "object",
                  },
                  "GetCollectionEndpoint<Mock>": {
                    "additionalProperties": true,
                    "description": "Rest endpoint model for getting / querying collections",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "findOptions": {
                            "$ref": "#/definitions/FindOptions%3CMock%2C(%22id%22%7C%22value%22)%5B%5D%3E",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/GetCollectionResult%3CMock%3E",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "GetCollectionResult<Mock>": {
                    "additionalProperties": true,
                    "description": "Response Model for GetCollection",
                    "properties": {
                      "count": {
                        "description": "The Total count of entities",
                        "type": "number",
                      },
                      "entries": {
                        "description": "List of the selected entities",
                        "items": {
                          "$ref": "#/definitions/Mock",
                        },
                        "type": "array",
                      },
                    },
                    "required": [
                      "count",
                      "entries",
                    ],
                    "type": "object",
                  },
                  "GetEntityEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for getting a single entity",
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "select": {
                            "description": "The list of fields to select",
                            "items": {
                              "enum": [
                                "id",
                                "value",
                              ],
                              "type": "string",
                            },
                            "type": "array",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "description": "The entity's unique identifier",
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                      "url",
                    ],
                    "type": "object",
                  },
                  "Mock": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "id",
                      "value",
                    ],
                    "type": "object",
                  },
                  "PatchEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for updating entities",
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                          "value": {
                            "type": "string",
                          },
                        },
                        "type": "object",
                      },
                      "result": {
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                      "url",
                    ],
                    "type": "object",
                  },
                  "PostEndpoint<Mock,"id">": {
                    "additionalProperties": true,
                    "description": "Endpoint model for creating new entities",
                    "properties": {
                      "body": {
                        "$ref": "#/definitions/WithOptionalId%3CMock%2C%22id%22%3E",
                      },
                      "result": {
                        "$ref": "#/definitions/Mock",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "RestApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "type": "object",
                  },
                  "ValidateBody": {
                    "additionalProperties": true,
                    "properties": {
                      "body": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "body",
                    ],
                    "type": "object",
                  },
                  "ValidateHeaders": {
                    "additionalProperties": true,
                    "properties": {
                      "headers": {
                        "additionalProperties": true,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "headers",
                    ],
                    "type": "object",
                  },
                  "ValidateQuery": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "bar": {
                            "type": "number",
                          },
                          "baz": {
                            "type": "boolean",
                          },
                          "foo": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "foo",
                          "bar",
                          "baz",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "query",
                    ],
                    "type": "object",
                  },
                  "ValidateUrl": {
                    "additionalProperties": true,
                    "properties": {
                      "result": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                      "url": {
                        "additionalProperties": false,
                        "properties": {
                          "id": {
                            "type": "number",
                          },
                        },
                        "required": [
                          "id",
                        ],
                        "type": "object",
                      },
                    },
                    "required": [
                      "url",
                    ],
                    "type": "object",
                  },
                  "ValidationApi": {
                    "additionalProperties": true,
                    "properties": {
                      "CONNECT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "DELETE": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/DeleteEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "GET": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/GetCollectionEndpoint%3CMock%3E",
                          },
                          "/mock/:id": {
                            "$ref": "#/definitions/GetEntityEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-headers": {
                            "$ref": "#/definitions/ValidateHeaders",
                          },
                          "/validate-query": {
                            "$ref": "#/definitions/ValidateQuery",
                          },
                          "/validate-url/:id": {
                            "$ref": "#/definitions/ValidateUrl",
                          },
                        },
                        "required": [
                          "/validate-query",
                          "/validate-url/:id",
                          "/validate-headers",
                          "/mock",
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "HEAD": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "OPTIONS": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "PATCH": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock/:id": {
                            "$ref": "#/definitions/PatchEndpoint%3CMock%2C%22id%22%3E",
                          },
                        },
                        "required": [
                          "/mock/:id",
                        ],
                        "type": "object",
                      },
                      "POST": {
                        "additionalProperties": false,
                        "properties": {
                          "/mock": {
                            "$ref": "#/definitions/PostEndpoint%3CMock%2C%22id%22%3E",
                          },
                          "/validate-body": {
                            "$ref": "#/definitions/ValidateBody",
                          },
                        },
                        "required": [
                          "/validate-body",
                          "/mock",
                        ],
                        "type": "object",
                      },
                      "PUT": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                      "TRACE": {
                        "additionalProperties": {
                          "additionalProperties": false,
                          "properties": {
                            "body": {},
                            "headers": {},
                            "query": {},
                            "result": {},
                            "url": {},
                          },
                          "required": [
                            "result",
                          ],
                          "type": "object",
                        },
                        "type": "object",
                      },
                    },
                    "required": [
                      "GET",
                      "POST",
                      "PATCH",
                      "DELETE",
                    ],
                    "type": "object",
                  },
                  "WithOptionalId<Mock,"id">": {
                    "additionalProperties": true,
                    "properties": {
                      "id": {
                        "type": "string",
                      },
                      "value": {
                        "type": "string",
                      },
                    },
                    "required": [
                      "value",
                    ],
                    "type": "object",
                  },
                },
              },
              "schemaName": "ValidateUrl",
            },
          }
        `)
      })
    })
  })

  describe('Validation errors', () => {
    it('Should validate query', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(5)
        try {
          await client({
            method: 'GET',
            action: '/validate-query',
            query: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(responseJson.errors[0].params.missingProperty).toEqual('foo')
            expect(responseJson.errors[1].params.missingProperty).toEqual('bar')
            expect(responseJson.errors[2].params.missingProperty).toEqual('baz')
          }
        }
      })
    })
    it('Should validate url', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(4)
        try {
          await client({
            method: 'GET',
            action: '/validate-url/:id',
            url: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(responseJson.errors[0].params.type).toEqual('number')
            expect(responseJson.errors[0].instancePath).toEqual('/url/id')
          }
        }
      })
    })
    it('Should validate headers', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(3)
        try {
          await client({
            method: 'GET',
            action: '/validate-headers',
            headers: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(
              responseJson.errors.find((e) => e.keyword === 'required' && e.message?.includes('foo')),
            ).toBeDefined()
          }
        }
      })
    })
    it('Should validate body', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        expect.assertions(3)
        try {
          await client({
            method: 'POST',
            action: '/validate-body',
            body: undefined as any,
          })
        } catch (error) {
          if (error instanceof ResponseError) {
            expect(error.message).toBe('Bad Request')
            expect(error.response?.status).toBe(400)
            const responseJson: { errors: Ajv.ErrorObject[] } = await error.response.json()
            expect(responseJson.errors[0].params.missingProperty).toEqual('body')
          }
        }
      })
    })
  })

  describe('Validation Success', () => {
    it('Should validate query', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-query',
          query: {
            foo: 'foo',
            bar: 2,
            baz: false,
          },
        })
        expect(result.response.status).toBe(200)
        expect(result.result.foo).toBe('foo')
        expect(result.result.bar).toBe(2)
        expect(result.result.baz).toBe(false)
      })
    })
    it('Should validate url', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-url/:id',
          url: { id: 3 },
        })
        expect(result.response.status).toBe(200)
        expect(result.result.id).toBe(3)
      })
    })
    it('Should validate headers', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'GET',
          action: '/validate-headers',
          headers: {
            foo: 'foo',
            bar: 42,
            baz: true,
          },
        })
        expect(result.response.status).toBe(200)
        expect(result.result.foo).toBe('foo')
        expect(result.result.bar).toBe(42)
        expect(result.result.baz).toBe(true)
      })
    })
    it('Should validate body', async () => {
      await usingAsync(await createValidateApi(), async ({ client }) => {
        const result = await client({
          method: 'POST',
          action: '/validate-body',
          body: {
            foo: 'foo',
            bar: 42,
            baz: true,
          },
        })

        expect(result.response.status).toBe(200)
        expect(result.result.foo).toBe('foo')
        expect(result.result.bar).toBe(42)
        expect(result.result.baz).toBe(true)
      })
    })
  })
})
