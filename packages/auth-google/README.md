# @furystack/auth-google

Google Authentication for FuryStack

Usage example:

```ts
const myInjector = new Injector()
myInjector.useHttpApi().addHttpRouting(msg => {
  const urlPathName = parse(msg.url || '', true).pathname
  if (urlPathName === '/googleLogin') {
    return GoogleLoginAction
  }
})
```

A POST request with a {'token': 'google-id-token-value'} body will log in the user with Google Oauth

The GoogleLoginService will add the user to the default User store, if not exists.
