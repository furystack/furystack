<!-- version-type: patch -->

# furystack

## 🔧 Chores

- Workspace repository patch release to ship the nested-router API extensions (`query` / `hash` schemas, `defineNestedRoutes`, `createNestedHooks`), the `href` → `path` rename across `@furystack/shades`, `@furystack/shades-common-components` and the showcase app, and a workspace-wide cleanup of long-deprecated APIs: the legacy flat `Router` / `RouteLink` / `LinkToRoute` in `@furystack/shades`; the legacy `Grid`, `Autocomplete` and `CollectionService` row-callback options in `@furystack/shades-common-components`; the `SwaggerDocument` type and `/swagger.json` endpoint in `@furystack/rest`; the static `LoginAction`, Swagger-named aliases (`generateSwaggerJsonFromApiSchema`, `CreateGetSwaggerJsonAction`, `CreateDeprecatedSwaggerRedirect`, `WithSchemaAndSwaggerAction`) and the auto-registered `/swagger.json` endpoint in `@furystack/rest-service`; and the static `JwtLoginAction` plus the legacy `onAccessTokenChanged` / `onRefreshTokenChanged` / `onRefreshFailed` callback options in `@furystack/auth-jwt`. See individual package changelogs for migration notes.
