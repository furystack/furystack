# rest-service

REST service (implementation) package for `@furystack/rest`.

## Usage

Start by importing your custom API endpoint interface (see `@furystack/rest`) and use the `.useRestService<MyApi>(...)` injector extension method. You can define multiple REST services per injector (even on the same port).

### Implementing a Custom API

Usage example – authenticated GET, GET collection, and POST APIs for a custom entity that has a physical store and repository set up:

```ts
import { MyApi, MyEntity } from 'my-common-package'
import { Injector } from '@furystack/inject'
import {
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  Authenticate,
  createPostEndpoint,
  useHttpAuthentication,
  useRestService,
} from '@furystack/rest-service'

const myInjector = new Injector()
useHttpAuthentication(myInjector)
await useRestService<MyApi>({
  injector: myInjector,
  port: 8080, // The port to listen on
  root: '/api', // Routes will be joined on this root path
  cors: {
    // Enable CORS
    credentials: true, // Enable cookies for CORS
    origins: ['https://my-frontend-1', 'https://my-frontend-2'], // Allowed origins
  },
  // This API should implement *all* methods that are defined in `MyApi`
  api: {
    // Endpoints that can be called with GET HTTP method
    GET: {
      '/my-entities': Authenticate()(createGetCollectionEndpoint({ model: MyEntity, primaryKey: 'id' })),
      '/my-entities/:id': Authenticate()(createGetEntityEndpoint({ model: MyEntity, primaryKey: 'id' })),
    },
    // Endpoints that can be called with POST HTTP method
    POST: {
      '/my-entities': Authenticate()(createPostEndpoint({ model: MyEntity, primaryKey: 'id' })),
    },
  },
})
```

### Endpoint Generators (Based on Repository DataSets)

If you use the underlying layers of FuryStack (`PhysicalStore` -> `Repository`) for an entity type, you can easily create some CRUD endpoints for them. These include:

- createDeleteEndpoint()
- createGetCollectionEndpoint()
- createGetEntityEndpoint()
- createPatchEndpoint()
- createPostEndpoint()

The endpoints will use the defined Physical Stores for retrieving entities and the Repository for authorization / event subscriptions.

### Custom Endpoint Implementation

To implement an endpoint with custom logic, define it as follows:

```ts
import { Injector } from '@furystack/inject'
import { RestApi } from '@furystack/rest'

export type MyCustomRequestAction = {
  /** The request should contain this POST Body structure */
  body: {
    foo: string
    bar: number
  }
  /** Parameter(s) from the URL */
  url: {
    /** This should be also a part of the URL with the `:entityId` syntax */
    entityId: string
  }

  /** The request should contain this query string parameters in the `?foo=asd&bar=2&baz=false` format */
  query: { foo?: string; bar?: number; baz?: boolean }

  /** The request should contain these header values */
  headers: { foo: string; bar: number; baz: boolean }

  /** The endpoint will return the following structure in the response */
  result: {
    success: boolean
  }
}

/** In a Common module */
export interface MyApiWithCustomEndpoint extends RestApi {
  POST: {
    '/my-custom-request-action/:entityId': MyCustomRequestAction
  }
}

/** In the Backend code */

import { JsonResult, useRestService } from '@furystack/rest-service'

const i = new Injector()

await useRestService<MyApiWithCustomEndpoint>({
  injector: i,
  port: 8080,
  root: '/mockApi',
  api: {
    POST: {
      '/my-custom-request-action/:entityId': async ({
        getBody,
        getQuery,
        getUrlParams,
        headers,
        injector,
        // request, // This will be the plain IncomingMessage - you can use it for lower level funcionality, e.g. parsing form data
        // response, // This will be the plain ServerResponse - you can use it for lower level functionality, e.g. streaming binaries
      }) => {
        const body = await getBody() // Body type will be resolved
        console.log(body)

        const queryString = getQuery() // Query types will be resolved
        console.log(queryString)

        const { entityId } = getUrlParams()
        console.log('entity id is:', entityId)

        console.log('The headers are:', headers) /** {foo: 'asd', bar: 2, baz: false} */

        const currentUser = await injector.getCurrentUser() // Injector is scoped to the Request
        console.log('The current user is:', currentUser)

        return JsonResult({ success: true }, 200)
      },
    },
  },
})

/** In the Client */

import { createClient } from '@furystack/rest-client-fetch'

const callApi = createClient<MyApiWithCustomEndpoint>({
  endpointUrl: 'https://localhost:8080/mockApi',
})

const getResult = async () =>
  callApi({
    method: 'POST', // This should be the first property in order to continue with IntelliSense
    action: '/my-custom-request-action/:entityId', // The Request Action name - The rest will be resolved from the types
    body: {
      foo: 'asd',
      bar: 42,
    },
    headers: {
      foo: 'asd',
      bar: 2,
      baz: false,
    },
    query: {
      foo: 'asd',
    },
    url: {
      entityId: 'asd-123',
    },
  })

getResult().then((data) => {
  console.log(data.result) // will be { success: true }
  console.log(data.response.status) // will be 200
})
```

### Payload Validation

Type-safe APIs do **NOT** come with built-in validation by default - but you can use the JSON Schema for full payload validation.
The preferred way is:

1. Create your API interface
1. Create JSON Schemas from the API (The `ts-json-schema-generator` package is the best solution nowadays, you can check how it works, [here](https://github.com/furystack/furystack/blob/develop/package.json#L39))
1. Use the Validate middleware, as shown in the following example:

```ts
import schema from './path-to-my/generated-schema.json'
const myValidatedApi = Validate({
  schema,
  schemaName: 'MyCustomRequestAction' // As defined in the example above
})(...myApiImplementation...)

```

In that way, you will get full validation for _all_ defined endpoint data (header, body, url parameters, query string) with verbose error messages from `ajv` (see [integration tests](https://github.com/furystack/furystack/blob/develop/packages/rest-service/src/validate.integration.spec.ts))

### Authentication and HttpUserContext

You can use the built-in authentication that comes with this package. It contains a session (~cookie) based authentication and Basic Auth. You can use it with the `useHttpAuthentication()` helper:

```ts
import { useHttpAuthentication, useRestService } from '@furystack/rest-service'
import { Injector } from '@furystack/inject'

const myInjector = new Injector()
useHttpAuthentication(myInjector, {
  cookieName: 'sessionId', // The session ID will be stored in this cookie
  enableBasicAuth: true, // Enables / disables standard Basic Authentication
  model: ApplicationUserModel, // The custom User model. Should implement `User`
  getUserStore: (storeManager) => storeManager.getStoreFor(ApplicationUserModel, 'username'), // Callback to retrieve the User Store
  getSessionStore: (storeManager) => storeManager.getStoreFor(MySessionModel, 'sessionId'), // Callback to retrieve the Session Store
})
await useRestService<MyApi>({ injector: myInjector, ...apiOptions })
```

### Static File Serving

You can serve static files using the `useStaticFiles` helper:

```ts
import { useStaticFiles } from '@furystack/rest-service'

await useStaticFiles({
  injector,
  baseUrl: '/static',
  path: './public',
  port: 3000,
  fallback: 'index.html', // Optional fallback file
  headers: {
    'Cache-Control': 'public, max-age=3600',
  },
})
```

### HTTP Proxying

You can set up HTTP proxying with header and cookie transformation using the `useProxy` helper. The proxy functionality forwards requests to target servers and returns their responses:

```ts
import { useProxy } from '@furystack/rest-service'

// Basic proxy (forwards requests to target server)
await useProxy({
  injector,
  sourceBaseUrl: '/old',
  targetBaseUrl: 'https://example.com',
  pathRewrite: (path) => path.replace('/path', '/new'),
  sourcePort: 3000,
})

// Proxy with header transformation
await useProxy({
  injector,
  sourceBaseUrl: '/api/v1',
  targetBaseUrl: 'https://api.example.com',
  pathRewrite: (path) => path.replace('/legacy', '/v2'),
  sourcePort: 3000,
  headers: (originalHeaders) => ({
    'X-API-Version': 'v2',
    Authorization: 'Bearer new-token',
    'X-Forwarded-For': originalHeaders['x-forwarded-for'] || 'unknown',
  }),
})

// Proxy with request cookie transformation
await useProxy({
  injector,
  sourceBaseUrl: '/auth',
  targetBaseUrl: 'https://auth.example.com',
  pathRewrite: (path) => path.replace('/login', '/signin'),
  sourcePort: 3000,
  cookies: (originalCookies) => [
    ...originalCookies.filter((c) => !c.startsWith('old-session=')),
    'new-session=updated-session-id',
    'auth-provider=oauth2',
  ],
})

// Proxy with response cookie transformation
await useProxy({
  injector,
  sourceBaseUrl: '/api',
  targetBaseUrl: 'https://api.example.com',
  sourcePort: 3000,
  responseCookies: (setCookies) => {
    // Transform Set-Cookie headers from the target server
    return setCookies.map((cookie) => {
      // Change domain from target to your domain
      return cookie.replace('domain=api.example.com', 'domain=myapp.com')
    })
  },
})

// Proxy with timeout configuration
await useProxy({
  injector,
  sourceBaseUrl: '/api',
  targetBaseUrl: 'https://slow-api.example.com',
  sourcePort: 3000,
  timeout: 5000, // 5 second timeout (default is 30000ms)
})
```

**How Proxying Works:**

1. **Client makes request** to source URL (e.g., `GET /old/path`)
2. **Proxy server forwards request** to target URL (e.g., `https://example.com/new/path`)
3. **Target server responds** with content
4. **Proxy server returns response** to client

The proxy server acts as an intermediary, forwarding requests and responses while allowing header and cookie transformation.

**Error Handling and Monitoring:**

The proxy emits events when requests fail, allowing you to monitor and log errors:

```ts
import { ProxyManager } from '@furystack/rest-service'

// Set up error monitoring
const proxyManager = injector.getInstance(ProxyManager)
proxyManager.subscribe('onProxyFailed', ({ from, to, error }) => {
  console.error(`Proxy failed: ${from} -> ${to}`, error)
  // Send to your logging service
})
```

When the target server is unreachable or returns an error, the proxy returns `502 Bad Gateway` to the client. Errors are also emitted via the `onProxyFailed` event for monitoring.

**Configuration Options:**

- `timeout` (optional, default: 30000ms): Maximum time in milliseconds to wait for the target server to respond. If exceeded, the request is aborted and a 502 error is returned.
- `sourceBaseUrl`: The base URL path to match for proxying (e.g., `/api`, `/old`). Can be specified with or without a trailing slash.
- `targetBaseUrl`: The target server URL (must be a valid HTTP/HTTPS URL).
- `pathRewrite`: Optional function to transform the path before forwarding.
- `headers`: Optional function to transform request headers. **Note**: This receives headers _after_ filtering hop-by-hop headers (Connection, Keep-Alive, Transfer-Encoding, Upgrade, etc.) for security and protocol compliance.
- `cookies`: Optional function to transform request cookies.
- `responseCookies`: Optional function to transform response Set-Cookie headers.

**WebSocket Support:**

WebSocket proxying can be enabled by setting `enableWebsockets: true`:

```ts
await useProxy({
  injector,
  sourceBaseUrl: '/ws',
  targetBaseUrl: 'https://ws.example.com',
  sourcePort: 3000,
  enableWebsockets: true,
})
```

When enabled, the proxy will forward WebSocket upgrade requests to the target server, enabling bidirectional real-time communication. WebSocket connections support:

- Bidirectional message streaming (both text and binary)
- Path rewriting (applied to WebSocket upgrade requests)
- Header transformations (applied to upgrade requests)
- Timeout configuration (applies to upgrade handshake)
- Error monitoring via `onWebSocketProxyFailed` events

Monitor WebSocket proxy errors:

```ts
const proxyManager = injector.getInstance(ProxyManager)
proxyManager.subscribe('onWebSocketProxyFailed', ({ from, to, error }) => {
  console.error(`WebSocket proxy failed: ${from} -> ${to}`, error)
})
```

**Notes and Tips:**

- `pathRewrite` receives the substring of the original request URL after `sourceBaseUrl`, including the leading slash and any query string (e.g., for `GET /old/path?q=1` and `sourceBaseUrl='/old'` it gets `'/path?q=1'`). If you need to preserve or remove query strings, handle it inside your function.
- The proxy automatically adds `X-Forwarded-For`, `X-Forwarded-Host`, and `X-Forwarded-Proto`. You can override or extend these via the `headers(originalHeaders)` transformer if needed.
- WebSocket proxying is opt-in via `enableWebsockets: true`. When enabled, both HTTP and WebSocket requests can be proxied through the same endpoint.
- Multiple `Set-Cookie` headers from the target are preserved and can be transformed with `responseCookies`. Depending on your HTTP client, retrieving multiple `Set-Cookie` values may require client-specific APIs.
- You can bind the proxy to a specific host via `sourceHostName`:

```ts
await useProxy({
  injector,
  sourceHostName: '127.0.0.1',
  sourceBaseUrl: '/internal',
  targetBaseUrl: 'https://internal.example.com',
  sourcePort: 3001,
})
```

**Path Rewriting Examples:**

```ts
// Simple path replacement
pathRewrite: (path) => path.replace('/old-path', '/new-path')

// Complex path transformation
pathRewrite: (path) => {
  // Remove version prefix and add new one
  if (path.startsWith('/v1/')) {
    return path.replace('/v1/', '/v2/')
  }
  // Add prefix to all other paths
  return `/api${path}`
}

// Conditional rewriting based on path
pathRewrite: (path) => {
  if (path.includes('/admin/')) {
    return path.replace('/admin/', '/dashboard/')
  }
  return path
}

// Manipulating query strings
pathRewrite: (path) => {
  const [pathname, query] = path.split('?')
  const newPath = pathname.replace('/v1/', '/v2/')
  // Preserve or modify query string
  if (query) {
    return `${newPath}?${query}&version=2`
  }
  return newPath
}
```

**Header Transformation Notes:**

The `headers` transformation function receives headers **after** filtering hop-by-hop headers. These headers are automatically excluded for security and protocol compliance:

```ts
headers: (filteredHeaders) => {
  // filteredHeaders will NOT contain:
  // - connection, keep-alive, transfer-encoding, upgrade, etc.

  return {
    ...filteredHeaders,
    'X-API-Key': 'your-api-key',
    Authorization: 'Bearer token',
  }
}
```

### Built-in Actions

The package contains the following built-in actions:

- `ErrorAction` - for default error handling and dumping errors in the response
- `GetCurrentUser` - Returns the current user
- `IsAuthenticated` - Returns if a user is logged in
- `Login` - Login with a simple username + password combo
- `Logout` - Destroys the current session
- `NotFoundAction` - The default '404' fallback route
