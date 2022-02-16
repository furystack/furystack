# @furystack/auth-google

Google Authentication package for FuryStack

Use the injectable `GoogleLoginService` with a retrieved id_token to get Google User Data.

```ts
const googleUserData = await injector.getInstance(GoogleLoginService).getGoogleUserData(loginData.token)
```

Check the example `GoogleLoginAction` to get the idea
