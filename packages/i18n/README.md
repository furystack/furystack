# i18n

General internationalization and translation management package for FuryStack.

## Usage Example

You can initialize the i18n package as follows:

```ts
import { useI18N, createLanguage } from '@furystack/i18n'

const en = createLanguage({ code: 'en', values: { hello: 'Hello', bye: 'Bye' } })
const de = createLanguage({ code: 'de', values: { hello: 'Hallo' } })

useI18N(injector, en, de)
```

You can then use the service to translate strings:

```ts
import { I18NService } from '@furystack/i18n'

const service = injector.get(I18NService)

console.log(service.translate('hello')) // Outputs: 'Hello'
```

You can also change the current language:

```ts
service.setCurrentLanguage('de')
console.log(service.translate('hello')) // Outputs: 'Hallo'
```
