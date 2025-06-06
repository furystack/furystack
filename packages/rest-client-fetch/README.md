# rest-client-fetch

REST client package for `@furystack/rest` with a native Fetch implementation.
You can use this package to operate strongly typed REST APIs in the browser with the native `fetch` implementation.

```ts
import { MyApi } from 'my-common-package'
import { createClient } from '@furystack/rest-client-fetch'

export const callMyApi = createClient<MyApi>({
  endpointUrl: 'http://my-service-endpoint',
  requestInit: {
    credentials: 'include',
  },
})
```
