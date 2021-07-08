# rest-client-fetch

REST Client package for `@furystack/rest` with native Fetch implementation

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