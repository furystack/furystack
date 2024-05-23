# rest-service

REST Service (implementation) package for `@furystack/rest`

## Usage

You can start with importing your custom API Endpoint interface (see `@furystack/rest`) and with the `.useRestService<MyApi>(...)` injector extensions method. You can define multiple REST services per injector (even on the same port)

### Implementing a custom API

Usage example - Authenticated GET, GET Collection and POST APIs for a custom entity that has a physical store and repository set up

```ts
import { MyApi, MyEntity } from 'my-common-package'
import {
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  Authenticate,
  createPostEndpoint,
} from '@furystack/rest-service'

myInjector.useHttpAuthentication().useRestService<MyApi>({
  port: 8080, // The port to listen
  root: '/api', // Routes will be joined on this root path
  cors: {
    // Enable CORS
    credentials: true, // Enable cookies for CORS
    origins: ['https://my-frontend-1', 'https://my-frontend-2'], // Allowed origins
  },
  // This API should implement *all* methods that are defined in `MyApi`
  api: {
    // Endpoints that can be called with GET Http method
    GET: {
      '/my-entities': Authenticate()(createGetCollectionEndpoint({ model: MyEntity, primaryKey: 'id' })),
      '/my-entities/:id': Authenticate()(createGetEntityEndpoint({ model: MyEntity, primaryKey: 'id' })),
    },
    // Endpoints that can be called with GET Http method
    POST: {
      '/my-entities': Authenticate()(createPostEndpoint({ model: MyEntity, primaryKey: 'id' })),
    },
  },
})
```

### Endpoint generators (based on Repository DataSets)

If you use the underlying layers of FuryStack (`PhysicalStore` -> `Repository`) for an entity type, you can easily create some CRUD endpoints for them. These are the followings:

- createDeleteEndpoint()
- createGetCollectionEndpoint()
- createGetEntityEndpoint()
- createPatchEndpoint()
- createPostEndpoint()

The endpoints will use the defined Physical Stores for retrieving entities and the Repository for authorization / event subscriptions.

### Custom endpoint implementation

If you want to implement an endpoint with custom logic, you can define it in the following way:

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

import { JsonResult } from '@furystack/rest-service'

const i = new Injector()

i.useRestService<MyApiWithCustomEndpoint>({
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

### Payload validation

Type-safe APIs does **NOT** comes with built-in validation by default - but you can use the JSON Schema for full payload validation.
The prefferred way is:

1. Create your API interface
1. Create JSON Schemas from the API (The `ts-json-schema-generator` package is the best solution nowdays, you can check how it works, [here](https://github.com/furystack/furystack/blob/develop/package.json#L39))
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

You can use the build-in authentication that comes with this package. It contains a session (~cookie) based authentication and Basic Auth. You can use it with the `.useCommonAuth()` injector extension:

```ts
myInjector.useCommonAuth({{
    cookieName: 'sessionId', // The session ID will be stored in this cookie
    enableBasicAuth: true, // Enables / disables standard Basic Authentication
    model: ApplicationUserModel, // The custom User model. Should implement `User`
    hashMethod: (plainText) => myHashMethod(plainText), // Method for password hashing
    getSessionStore: (storeManager) => storeManager.getStoreFor(MySessionModel, 'id'), // Callback to retrieve the Session Store
    getUserStore: (storeManager) => storeManager.getStoreFor(ApplicationUserModel, 'id') // Callback to retrieve the User Store
  }).useRestService<MyApi>({...api options})
```

### Built-in actions

The package contains the following built-in actions

- `ErrorAction` - for default error handling and dumping errors in the response
- `GetCurrentUser` - Returns the current user
- `IsAuthenticated` - Returns if a user is logged in
- `Login` - Login with a simple username + password combo
- `Logout` - Destroys the current session
- `NotFoundAction` - The default '404' fallback route
