# rest-client-got

REST Client package for `@furystack/rest` with `got` implementation
You can use this package to operate strongly typed REST APIs in the browser and in NodeJS with the `got` library.

```ts

import { MyApi } from 'my-common-package'
import { createClient } from '@furystack/rest-client-got'

export const callMyApi = createClient<MyApi>({
    endpointUrl: 'http://my-service-endpoint',
})

```