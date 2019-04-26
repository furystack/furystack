# @furystack/http-api

## Usage example

```ts
const i = new Injector()
i.useHttpApi({
  /** custom http settings */
})
  .useHttpAuthentication({
    /** custom auth settings */
  })
  .addHttpRouting(req => {
    /** custom logic to resolve action(s) from the incoming request */
  })
  .useDefaultLoginRoutes() // register '/login', '/currentUser' and '/logout' actions
  .listenHttp() // start listening
```
