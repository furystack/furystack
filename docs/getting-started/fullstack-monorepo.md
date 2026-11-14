# Full-stack monorepo app (common + backend + frontend)

This in-repo guide shows a minimal, current recipe for building a FuryStack app with three workspaces:

- `common` — shared TypeScript types (REST API contract, entities/DTOs)
- `backend` — Node.js REST service, stores/datasets, auth, seeding
- `frontend` — Shades UI using the typed REST client

It is written so an automated agent (or a developer without external docs) can bootstrap a working app from this repository revision. For broader tutorials, see https://furystack.github.io/getting-started/ (keep public guides in sync with the APIs used here).

## 1. Recommended workspace layout

Example layout (Yarn workspaces):

```text
my-app/
  package.json            # workspaces: ["packages/*"]
  tsconfig.json           # solution-style references (optional but recommended)
  packages/
    common/
      package.json
      tsconfig.json
      src/
        index.ts
        api.ts            # RestApi interface
        models.ts         # shared models/DTOs
    backend/
      package.json
      tsconfig.json
      src/
        index.ts          # injector/bootstrap/start server
        stores.ts         # defineStore / store bindings
        datasets.ts       # defineDataSet tokens + auth/modify rules
        seed.ts           # first-run bootstrap (system identity)
    frontend/
      package.json
      tsconfig.json
      vite.config.ts
      index.html
      src/
        index.tsx
        api-client.ts
```

### Workspace dependencies (typical)

- `common`: `@furystack/rest` (types only)
- `backend`: `@furystack/inject`, `@furystack/core`, `@furystack/repository`, `@furystack/rest`, `@furystack/rest-service`, `@furystack/security` and/or `@furystack/auth-jwt`, plus a store adapter (e.g. `@furystack/sequelize-store`, `@furystack/mongodb-store`, `@furystack/filesystem-store`)
- `frontend`: `@furystack/shades`, `@furystack/shades-common-components` (optional), `@furystack/rest-client-fetch`, `@furystack/rest`, and `common`

Use `workspace:^` dependencies between `common`/`backend`/`frontend`.

### TypeScript / build notes

- Use TypeScript project references so `backend` and `frontend` can depend on built/typechecked `common`.
- Keep the REST contract in `common` and import it from both sides to preserve end-to-end types.
- Backend runs on Node.js (`>=24` for current FuryStack). Frontend is typically bundled with Vite; see `packages/shades-showcase-app` in this repo as a frontend-only reference.
- Align module/emit settings across packages (ESM is the norm in this monorepo). Build `common` before `backend`/`frontend` (or use `tsc -b` with references).

## 2. Shared API contract (`common`)

Define the API interface once:

```ts
// packages/common/src/api.ts
import type { RestApi } from '@furystack/rest'
import type { User } from './models.js'

export interface MyApi extends RestApi {
  GET: {
    '/currentUser': { result: User }
    '/isAuthenticated': { result: { isAuthenticated: boolean } }
  }
  POST: {
    '/login': { result: User; body: { username: string; password: string } }
    '/logout': { result: unknown }
  }
}
```

Keep models/DTOs serializable and shared. See `packages/rest/README.md` for endpoint schema options (`url`, `query`, `headers`, `body`, `result`).

## 3. Backend bootstrap

### 3.1 Define stores and datasets

Declare store tokens and dataset tokens at module scope. Bind persistent store implementations behind throw-by-default tokens during bootstrap.

```ts
// packages/backend/src/stores.ts
import { defineStore, InMemoryStore } from '@furystack/core'
import { User } from '@furystack/core'

export class AppUser extends User {
  declare roles: string[]
}

export const AppUserStore = defineStore({
  name: 'my-app/AppUserStore',
  model: AppUser,
  primaryKey: 'username',
  factory: () => new InMemoryStore({ model: AppUser, primaryKey: 'username' }),
})
```

For production, use an adapter helper such as `defineFileSystemStore`, `defineSequelizeStore`, `defineMongoDbStore`, or `defineRedisStore` and bind the shipped tokens to those implementations as needed.

```ts
// packages/backend/src/datasets.ts
import { defineDataSet } from '@furystack/repository'
import { AppUserStore } from './stores.js'

export const AppUserDataSet = defineDataSet({
  name: 'my-app/AppUserDataSet',
  store: AppUserStore,
  // add authorize*/modify*/onEntity* hooks as required
})
```

### 3.2 HTTP authentication prerequisites (important)

`@furystack/rest-service` HTTP/session auth requires **all** of the following:

1. **Persistent/concrete stores bound** for `UserStore` and `SessionStore` (they throw by default).
2. A **`userDataSet`** token (`DataSetToken`) passed to `useHttpAuthentication(...)` so the current user can be loaded.
3. Stores/datasets registered on the injector **before** `useHttpAuthentication(...)` is called.

```ts
import { createInjector } from '@furystack/inject'
import {
  useHttpAuthentication,
  useRestService,
  UserStore,
  SessionStore,
  LoginAction,
  LogoutAction,
  GetCurrentUser,
  IsAuthenticated,
  JsonResult,
} from '@furystack/rest-service'
import { usePasswordPolicy } from '@furystack/security'
import type { MyApi } from 'common'
import { AppUserStore } from './stores.js'
import { AppUserDataSet } from './datasets.js'

export const startBackend = async () => {
  const injector = createInjector()

  // 1) Bind the shipped auth stores to your concrete stores
  // (use the same backing store/token you persist users/sessions in)
  injector.bind(UserStore, (ctx) => ctx.inject(AppUserStore))
  injector.bind(SessionStore, /* your session store token/factory */ () => /* ... */)

  // 2) Configure auth (order matters: prerequisites first)
  usePasswordPolicy(injector)
  useHttpAuthentication(injector, {
    userDataSet: AppUserDataSet,
    cookieName: 'sessionId',
    // cookieSecure: true in HTTPS deployments
    // cookieSameSite: 'Lax' (default). 'None' requires Secure.
  })

  // 3) Start REST API
  await useRestService<MyApi>({
    injector,
    root: '/api',
    port: 8080,
    cors: {
      credentials: true,
      origins: ['http://localhost:5173'], // frontend dev origin
    },
    api: {
      GET: {
        '/currentUser': GetCurrentUser,
        '/isAuthenticated': IsAuthenticated,
      },
      POST: {
        '/login': LoginAction as any, // or a custom action / strategy-based login
        '/logout': LogoutAction,
      },
    },
  })

  return injector
}
```

Notes:

- `LoginAction`/password flows require `@furystack/security` (`usePasswordPolicy`) and properly configured password credential stores. JWT login/refresh/logout uses `@furystack/auth-jwt` (`useJwtAuthentication`, `RefreshTokenStore` bound to a persistent store, and JWT actions/strategies). Read the package READMEs when enabling these flows.
- `RequestError`/action results control HTTP status codes; request bodies are limited (default 1 MiB) and `maxBodyBytes` can be configured per API.

### 3.3 First-run seed/bootstrap (create initial user safely)

Do **not** write through physical stores directly in app code; go through DataSets so authorization/hooks/events run. For trusted server-side scripts (seeding, migrations, jobs), use a system identity scope:

```ts
import { useSystemIdentityContext } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'
import { PasswordAuthenticator } from '@furystack/security'
import { AppUserDataSet } from './datasets.js'

export const seedAdmin = async (injector: import('@furystack/inject').Injector) => {
  await usingAsync(useSystemIdentityContext({ injector, username: 'seed-script' }), async (systemInjector) => {
    const users = getDataSetFor(systemInjector, AppUserDataSet)
    const existing = await users.find(systemInjector, { filter: { username: { $eq: 'admin' } } as any, top: 1 })
    if (existing.length) return

    // Example: create user entity; if using password auth also create/store credentials
    await users.add(systemInjector, { username: 'admin', roles: ['admin'] } as any)

    // If password auth is enabled, hash/store password via PasswordAuthenticator/credential store
    // according to your credential model and @furystack/security setup.
    // const auth = systemInjector.get(PasswordAuthenticator)
    // await auth.setPasswordForUser('admin', 'change-me')
  })
}
```

Adjust the credential creation step to match your chosen auth mechanism and store schema. Never expose a system-identity injector to request handlers.

## 4. Request validation (recommended)

Type-safe contracts do not validate runtime payloads by default. Typical flow:

1. Keep the API contract/types in `common`.
2. Generate JSON Schema from the API/types (for example with `ts-json-schema-generator`).
3. Wrap actions/endpoints with `Validate({ schema, schemaName })` from `@furystack/rest-service`.

Example (app-level script idea): generate `packages/common/src/api.schema.json` and import it in backend actions. The root `yarn create-schemas` script in this repo is specific to FuryStack packages, not your app.

```ts
import schema from 'common/api.schema.json' assert { type: 'json' }
import { Validate } from '@furystack/rest-service'

const createUser = Validate({ schema, schemaName: 'CreateUserAction' })(async (options) => {
  // ...
})
```

## 5. Frontend (Shades) + typed client

```ts
// packages/frontend/src/api-client.ts
import { createClient } from '@furystack/rest-client-fetch'
import type { MyApi } from 'common'

export const api = createClient<MyApi>({
  endpointUrl: '/api', // same-origin via dev proxy, or full backend URL
  requestInit: {
    credentials: 'include', // required for cookie/session auth
  },
})
```

Use the client from Shades components/services:

```ts
const { result } = await api({ method: 'GET', action: '/currentUser' })
```

See `packages/shades/README.md` and `packages/shades-common-components/README.md` for UI patterns. `packages/shades-showcase-app` is a frontend-only reference (routing, components, Vite config) but it does not include a backend.

## 6. Frontend ↔ backend integration (dev/prod)

### Development

Choose one:

- **Vite dev proxy (recommended, same-origin):** frontend calls `/api`; Vite proxies to `http://localhost:8080`. Cookies are same-origin, CORS config is simpler.
- **Cross-origin:** frontend (e.g. `http://localhost:5173`) calls backend (e.g. `http://localhost:8080`) directly. Configure:
  - Backend: `cors: { origins: ['http://localhost:5173'], credentials: true }`
  - Client: `requestInit: { credentials: 'include' }` and correct `endpointUrl`
  - Cookies: `cookieSecure: false` is acceptable for plain local HTTP; for HTTPS set `cookieSecure: true`. `SameSite=None` requires `Secure`.

### Production

- Serve frontend and backend on the same site/origin when possible (reverse proxy or `useStaticFiles`), or configure CORS/cookies for your real origins.
- Set `cookieSecure: true` behind HTTPS and choose an appropriate session lifetime (`cookieMaxAgeSeconds`) and `SameSite` policy.

## 7. Checklist

- [ ] Shared `RestApi` contract in `common`, imported by backend and frontend
- [ ] Store tokens defined; `UserStore`/`SessionStore` (and auth-specific stores) bound before auth setup
- [ ] `userDataSet` passed to `useHttpAuthentication`
- [ ] Login/logout/current-user (and JWT actions if used) wired in REST API
- [ ] Seed/bootstrap path for first user/data using `useSystemIdentityContext` + DataSets
- [ ] Client uses `credentials: 'include'` for cookie auth and correct dev/proxy/CORS settings
- [ ] Runtime validation added for untrusted inputs (recommended)
- [ ] Build/typecheck order works across workspaces

## Related in-repo docs

- `README.md`, `CONTEXT-MAP.md`, `CONTRIBUTING.md`
- `packages/rest-service/README.md`, `packages/rest/README.md`, `packages/rest-client-fetch/README.md`
- `packages/repository/README.md`, `packages/core/README.md`, `packages/security/README.md`, `packages/auth-jwt/README.md`
- `packages/shades/README.md`, `packages/shades-showcase-app/` (frontend-only example)
- `docs/migrations/v7-functional-di.md` (current DI/API patterns)
