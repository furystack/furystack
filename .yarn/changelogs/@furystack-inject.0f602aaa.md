<!-- version-type: major -->

# @furystack/inject

## 💥 Breaking Changes

Decorator-based DI is gone. Services are now declared with `defineService` / `defineServiceAsync`, which return opaque tokens; the `Injector` resolves tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `@Injectable`, `@Injected`. Use `defineService({ name, lifetime, factory })` instead.
- Removed `injector.getInstance(Class)`. Use `injector.get(Token)`; async tokens must use `injector.getAsync(Token)`.
- Removed `injector.setExplicitInstance(instance, Class)`. Use `injector.bind(Token, () => instance)` — any cached instance is dropped.
- Renamed `injector.createChild(opts)` → `injector.createScope(opts)`.
- Removed `injector.cachedSingletons`. If you probed for opt-in registration, declare a nullable scoped token (`Token<T | null, 'scoped'>`, default `null`) and have the parent bind it.
- `Constructable` moved to `@furystack/core`. Packages that imported it from `@furystack/inject` must switch the import and add `@furystack/core` as a dependency.
- `hasInjectorReference` is gone — use an `instanceof Injector` check on the candidate prop instead.
- Added `createInjector()` as the preferred root-injector factory, `withScope(parent, fn)` for scope-create-and-dispose patterns, `isToken(value)` for runtime token detection, and `Injector.isResolved(token)` for bootstrap helpers that need to fail loudly when a service was already resolved before they ran.

### Quick reference

Before:

```ts
@Injectable({ lifetime: 'singleton' })
class Logger {
  @Injected(Config) private config!: Config
  log(msg: string) {
    console.log(`[${this.config.level}] ${msg}`)
  }
}
const logger = injector.getInstance(Logger)
```

After:

```ts
export const LoggerToken = defineService({
  name: 'app/Logger',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const config = inject(Config)
    return { log: (msg: string) => console.log(`[${config.level}] ${msg}`) }
  },
})
const logger = injector.get(LoggerToken)
```
