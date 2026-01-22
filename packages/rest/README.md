# @furystack/rest

REST API type definitions and contracts for FuryStack.

This package provides the foundation for building type-safe REST APIs that are shared between your backend and frontend.

## Installation

```bash
npm install @furystack/rest
# or
yarn add @furystack/rest
```

## Concept

The FuryStack REST approach works as follows:

1. **Define** your REST API as a TypeScript interface in a shared package
2. **Implement** the API on the backend using `@furystack/rest-service`
3. **Consume** the API on the frontend using `@furystack/rest-client-fetch`
4. **Benefit** from end-to-end type safety

## Defining an API

Create an API interface that describes all endpoints:

```ts
import type { RestApi } from '@furystack/rest'

// Define your models
interface User {
  id: string
  name: string
  email: string
}

interface CreateUserDto {
  name: string
  email: string
}

// Define your API
export interface MyApi extends RestApi {
  GET: {
    // Simple endpoint returning a list
    '/users': { result: User[] }
    
    // Endpoint with URL parameters
    '/users/:id': {
      result: User
      url: { id: string }
    }
    
    // Endpoint with query parameters
    '/users/search': {
      result: User[]
      query: { name?: string; email?: string }
    }
  }
  
  POST: {
    // Endpoint with request body
    '/users': {
      result: User
      body: CreateUserDto
    }
    
    // Endpoint with custom headers
    '/users/import': {
      result: { imported: number }
      body: User[]
      headers: { 'X-Import-Mode': 'merge' | 'replace' }
    }
  }
  
  PATCH: {
    '/users/:id': {
      result: User
      url: { id: string }
      body: Partial<CreateUserDto>
    }
  }
  
  DELETE: {
    '/users/:id': {
      result: { success: boolean }
      url: { id: string }
    }
  }
}
```

## Endpoint Schema

Each endpoint can define:

| Property | Type | Description |
|----------|------|-------------|
| `result` | any | The response body type (required) |
| `url` | object | URL path parameters (e.g., `:id`) |
| `query` | object | Query string parameters |
| `body` | any | Request body type |
| `headers` | object | Required headers |

## HTTP Methods

The `RestApi` type supports all standard HTTP methods:

- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Replace resources
- `PATCH` - Partially update resources
- `DELETE` - Remove resources
- `HEAD` - Retrieve headers only
- `OPTIONS` - Retrieve supported methods
- `CONNECT` - Establish tunnel
- `TRACE` - Diagnostic trace

## Schema Endpoint

You can expose your API schema for documentation:

```ts
import type { WithSchemaAction, RestApi } from '@furystack/rest'

// Add schema endpoints to your API
export type MyApiWithSchema = WithSchemaAction<MyApi>

// This adds:
// GET /schema - Returns the API schema
// GET /swagger.json - Returns Swagger/OpenAPI documentation
```

## Utilities

### Query String Serialization

```ts
import { serializeToQueryString, deserializeQueryString } from '@furystack/rest'

const queryString = serializeToQueryString({ name: 'John', active: true })
// Returns: 'name=John&active=true'

const params = deserializeQueryString('name=John&active=true')
// Returns: { name: 'John', active: 'true' }
```

### Request Error

```ts
import { RequestError } from '@furystack/rest'

// Throw typed errors in your API
throw new RequestError('User not found', 404)
```

## Best Practices

1. **Shared Package**: Put your API interface in a shared package that both frontend and backend can import
2. **Consistent Naming**: Use RESTful naming conventions for endpoints
3. **Explicit Types**: Define explicit types for all request/response bodies
4. **Documentation**: Use JSDoc comments on your API interface for documentation
