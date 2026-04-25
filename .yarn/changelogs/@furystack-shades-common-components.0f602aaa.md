<!-- version-type: major -->

# @furystack/shades-common-components

## 💥 Breaking Changes

Common services are declassed and moved behind DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- `ThemeProviderService` and `NotyService` declassed to plain-object factories. The `EventHub` surface is preserved via composition (`Object.assign(hub, { ...methods })`). Resolve via `injector.get(ThemeProviderService)` / `injector.get(NotyService)`.
- `LayoutService` is now a throw-by-default scoped token plus a `createLayoutService(targetElement?)` factory. `<PageLayout>` creates `injector.createScope({ owner: 'page-layout' })`, instantiates the service, and `scope.bind(LayoutService, () => instance)`. Descendants (`<Drawer>`, `<DrawerToggleButton>`) resolve the scoped token as before.
- `FormService` declassed. Added `FormContextToken: Token<FormService | null, 'scoped'>` (default `null`) to replace `injector.cachedSingletons.has(FormService)` probes. `<Form>` binds the token on its own scope; inputs that opt into form integration read it via `injector.get(FormContextToken)` and branch on `null`.
- `SuggestManager` and `CommandPaletteManager` dropped `@Injectable` but remain plain classes — they are `new`'d inside `useDisposable` hooks, never resolved from the injector.
