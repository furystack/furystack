# @furystack/rest-client-fetch

REST client for FuryStack with native Fetch implementation.

This package provides a type-safe client for consuming REST APIs defined with `@furystack/rest` in the browser.

## Installation

```bash
npm install @furystack/rest-client-fetch
# or
yarn add @furystack/rest-client-fetch
```

## Usage

### Basic Setup

```ts
import { createClient } from '@furystack/rest-client-fetch'
import type { MyApi } from 'my-common-package'

const api = createClient<MyApi>({
  endpointUrl: 'http://localhost:8080/api',
  requestInit: {
    credentials: 'include', // Include cookies for authentication
  },
})
```

### Making Requests

```ts
// GET request
const { result, response } = await api({
  method: 'GET',
  action: '/users',
})
console.log(result) // Array of users

// GET request with URL parameters
const { result: user } = await api({
  method: 'GET',
  action: '/users/:id',
  url: { id: '123' },
})

// GET request with query parameters
const { result: filtered } = await api({
  method: 'GET',
  action: '/users',
  query: { role: 'admin', active: true },
})

// POST request with body
const { result: created } = await api({
  method: 'POST',
  action: '/users',
  body: { name: 'John', email: 'john@example.com' },
})

// Request with custom headers
const { result } = await api({
  method: 'GET',
  action: '/protected-resource',
  headers: { 'X-Custom-Header': 'value' },
})
```

### Error Handling

```ts
import { ResponseError } from '@furystack/rest-client-fetch'

try {
  const { result } = await api({
    method: 'GET',
    action: '/users/:id',
    url: { id: 'not-found' },
  })
} catch (error) {
  if (error instanceof ResponseError) {
    console.log('Status:', error.response.status)
    console.log('Message:', error.message)
  }
}
```

### Custom Response Parser

```ts
const { result } = await api({
  method: 'GET',
  action: '/binary-data',
  responseParser: async (response) => {
    const blob = await response.blob()
    return { response, result: blob }
  },
})
```

### Custom Query Serialization

```ts
const api = createClient<MyApi>({
  endpointUrl: 'http://localhost:8080/api',
  serializeQueryParams: (params) => {
    // Custom serialization logic
    return `?${new URLSearchParams(params).toString()}`
  },
})
```

## Client Options

| Option                 | Type                     | Description                                          |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| `endpointUrl`          | `string`                 | Base URL for the API                                 |
| `fetch`                | `typeof fetch`           | Custom fetch implementation (optional)               |
| `requestInit`          | `RequestInit`            | Default request options (headers, credentials, etc.) |
| `serializeQueryParams` | `(param: any) => string` | Custom query string serializer                       |

## Type Safety

The client is fully type-safe. When you define your API interface:

```ts
// In your common package
interface MyApi extends RestApi {
  GET: {
    '/users': { result: User[] }
    '/users/:id': { result: User; url: { id: string } }
  }
  POST: {
    '/users': { result: User; body: CreateUserDto }
  }
}
```

The client will enforce correct types for:

- Method (`GET`, `POST`, etc.)
- Action (the URL path)
- URL parameters
- Query parameters
- Request body
- Response type
