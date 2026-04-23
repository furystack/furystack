# @furystack/i18n

General internationalization and translation management package for FuryStack.

## Installation

```bash
npm install @furystack/i18n
# or
yarn add @furystack/i18n
```

## Usage Example

`defineI18N(defaultLanguage, ...additionalLanguages)` mints a per-app singleton
token that resolves to a configured `I18NService`. Declare the token once at
module scope and reuse it across the app — inlining the call inside a
component or helper defeats singleton caching:

```ts
import { createInjector } from '@furystack/inject'
import { createLanguage, defineI18N } from '@furystack/i18n'

const en = createLanguage({ code: 'en', values: { hello: 'Hello', bye: 'Bye' } })
const de = createLanguage({ code: 'de', values: { hello: 'Hallo' } })

export const AppI18n = defineI18N(en, de)

const injector = createInjector()
const service = injector.get(AppI18n)

console.log(service.translate('hello')) // 'Hello'
```

Change the current language:

```ts
service.currentLanguage = 'de'
console.log(service.translate('hello')) // 'Hallo'
```

The service's listeners and resources are cleaned up when the owning injector
is disposed — `defineI18N` registers the teardown on its factory's
`onDispose` hook.

> **TypeScript tip:** each app defines its own token so the translation keys
> can be inferred as a literal union. Library code that wants to accept any
> i18n service should type the parameter as `I18NService<Record<string,
string>>` rather than reaching for a shared library-level token.
