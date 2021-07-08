# rest-client-got

REST Client package for `@furystack/rest` with `got` implementation

```ts

import { MyApi } from 'my-common-package'
import { createClient } from '@furystack/rest-client-got'

export const callMyApi = createClient<MyApi>({
    endpointUrl: 'http://my-service-endpoint',
})

```