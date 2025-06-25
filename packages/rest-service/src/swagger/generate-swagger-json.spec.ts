import type { ApiEndpointDefinition, ParameterObject, ReferenceObject, ResponseObject } from '@furystack/rest'
import { describe, expect, it } from 'vitest'
import { generateSwaggerJsonFromApiSchema } from './generate-swagger-json.js'

describe('generateSwaggerJsonFromApiSchema', () => {
  it('Should generate a basic Swagger document with correct OpenAPI structure', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/test': {
        method: 'GET',
        path: '/api/test',
        isAuthenticated: false,
        schemaName: 'Test',
        schema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check basic structure
    expect(result.openapi).toBe('3.1.0')
    expect(result.info.title).toBe('FuryStack API')
    expect(result.info.version).toBe('1.0.0')

    // Check security scheme is defined correctly for cookie-based auth
    expect(result.components?.securitySchemes?.cookieAuth).toEqual({
      type: 'apiKey',
      in: 'cookie',
      name: 'session',
    })
  })

  it('Should convert API endpoints to OpenAPI paths correctly', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/users': {
        method: 'GET',
        path: '/api/users',
        isAuthenticated: true,
        schemaName: 'UserCollection',
        schema: { type: 'array', items: { type: 'object' } },
      },
      '/api/users/:id': {
        method: 'GET',
        path: '/api/users/:id',
        isAuthenticated: true,
        schemaName: 'User',
        schema: { type: 'object', properties: { id: { type: 'string' } } },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check paths
    expect(result.paths?.['/api/users']).toBeDefined()
    expect(result.paths?.['/api/users/{id}']).toBeDefined()

    // Check methods
    expect(result.paths?.['/api/users']?.get).toBeDefined()
    expect(result.paths?.['/api/users/{id}']?.get).toBeDefined()

    // Check security - should use cookieAuth for authenticated endpoints
    expect(result.paths?.['/api/users']?.get?.security).toEqual([{ cookieAuth: [] }])
    expect(result.paths?.['/api/users/{id}']?.get?.security).toEqual([{ cookieAuth: [] }])
  })

  it('Should extract path parameters correctly', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/users/:userId/posts/:postId': {
        method: 'GET',
        path: '/api/users/:userId/posts/:postId',
        isAuthenticated: false,
        schemaName: 'Post',
        schema: { type: 'object' },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check path parameters
    const parameters = result.paths?.['/api/users/{userId}/posts/{postId}']?.get?.parameters as ParameterObject[]
    expect(parameters).toHaveLength(2)
    expect(parameters?.[0].name).toBe('userId')
    expect(parameters?.[0].in).toBe('path')
    expect(parameters?.[0].required).toBe(true)
    expect(parameters?.[1].name).toBe('postId')
    expect(parameters?.[1].in).toBe('path')
    expect(parameters?.[1].required).toBe(true)
  })

  it('Should handle different HTTP methods correctly', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/resource-get': {
        method: 'GET',
        path: '/api/resource-get',
        isAuthenticated: false,
        schemaName: 'Resource',
        schema: { type: 'object' },
      },
      '/api/resource-post': {
        method: 'POST',
        path: '/api/resource-post',
        isAuthenticated: true,
        schemaName: 'ResourceInput',
        schema: { type: 'object' },
      },
      '/api/resource-put/:id': {
        method: 'PUT',
        path: '/api/resource-put/:id',
        isAuthenticated: true,
        schemaName: 'ResourceUpdate',
        schema: { type: 'object' },
      },
      '/api/resource-delete/:id': {
        method: 'DELETE',
        path: '/api/resource-delete/:id',
        isAuthenticated: true,
        schemaName: 'ResourceDelete',
        schema: { type: 'object' },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check multiple methods
    expect(result.paths?.['/api/resource-get'].get).toBeDefined()
    expect(result.paths?.['/api/resource-post'].post).toBeDefined()
    expect(result.paths?.['/api/resource-put/{id}'].put).toBeDefined()
    expect(result.paths?.['/api/resource-delete/{id}'].delete).toBeDefined()

    // Verify security is applied correctly based on isAuthenticated
    expect(result.paths?.['/api/resource-get'].get?.security).toEqual([])
    expect(result.paths?.['/api/resource-post'].post?.security).toEqual([{ cookieAuth: [] }])
  })

  it('Should include schemas in components', () => {
    const testSchema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        age: { type: 'number' },
      },
    }

    const api: Record<string, ApiEndpointDefinition> = {
      '/api/test': {
        method: 'GET',
        path: '/api/test',
        isAuthenticated: false,
        schemaName: 'TestModel',
        schema: testSchema,
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check schema is included in components
    expect(result.components?.schemas?.TestModel).toEqual(testSchema)
  })

  it('Should handle responses with correct status codes and content types', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/test': {
        method: 'GET',
        path: '/api/test',
        isAuthenticated: false,
        schemaName: 'Test',
        schema: { type: 'object' },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check response structure
    const responses = result.paths?.['/api/test'].get?.responses as Record<string, ResponseObject>

    const response200 = responses?.['200']
    expect(response200).toBeDefined()
    expect(response200.description).toBe('Successful operation')
    expect((response200.content?.['application/json']?.schema as ReferenceObject).$ref).toBe(
      '#/components/schemas/Test',
    )
    expect(responses?.['401']).toBeDefined()
    expect(responses?.['500']).toBeDefined()
    expect(responses?.['401'].description).toBe('Unauthorized')
    expect(responses?.['500'].description).toBe('Internal server error')
  })

  it('Should use empty path object if it does not exist - for code coverage', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/test': {
        method: 'GET',
        path: '/api/test',
        isAuthenticated: false,
        schemaName: 'Test',
        schema: { type: 'object' },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // This test is mainly for coverage, checking that the path initialization logic works
    expect(result.paths?.['/api/test']).toBeDefined()
  })

  it('Should handle endpoints without schemas', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/no-schema': {
        method: 'GET',
        path: '/api/no-schema',
        isAuthenticated: false,
        schemaName: 'EmptySchema',
        schema: null as any,
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Should still create the path without errors
    expect(result.paths?.['/api/no-schema']).toBeDefined()
    expect(result.paths?.['/api/no-schema'].get).toBeDefined()
  })

  it('Should use operationId based on method and path', () => {
    const api: Record<string, ApiEndpointDefinition> = {
      '/api/users/:id/profile': {
        method: 'GET',
        path: '/api/users/:id/profile',
        isAuthenticated: false,
        schemaName: 'UserProfile',
        schema: { type: 'object' },
      },
    }

    const result = generateSwaggerJsonFromApiSchema({ api })

    // Check operationId format
    expect(result.paths?.['/api/users/{id}/profile'].get?.operationId).toBe('get_api_users_id_profile')
  })
})
