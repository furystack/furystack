<!-- version-type: major -->

# @furystack/i18n

## 💥 Breaking Changes

`I18NService` is no longer a shared library-level DI token. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed the shared `I18NService` DI token and the `useI18N(injector, ...languages)` helper.
- Added `defineI18N<TKeys>(defaultLanguage, ...additionalLanguages)` — mints a per-app singleton token that preserves literal-key inference. Declare it once at module scope:
  ```ts
  export const AppI18n = defineI18N(en, de)
  const service = injector.get(AppI18n)
  ```
- `I18NServiceImpl` is still exported for direct instantiation in tests.
