# @furystack/shades-i18n

Internationalization package for FuryStack Shades UI.

## Installation

```bash
npm install @furystack/shades-i18n
# or
yarn add @furystack/shades-i18n
```

## Usage Example

```ts
import { createLanguage, I18NService } from '@furystack/i18n'
import { createI18nComponent } from '@furystack/shades-i18n'

// Examples imported from JSON files
import de from './de.json' with { type: 'json' }
import en from './en.json' with { type: 'json' }
import es from './es.json' with { type: 'json' }

// Examples created manually
const hu = createLanguage({
  code: 'hu',
  values: {
    greeting: 'Szia',
    farewell: 'Viszlát',
  },
})

const fr = createLanguage({
  code: 'fr',
  values: {
    greeting: 'Bonjour',
    // farewell: 'Au revoir', // Should fall back to en
  },
})

const service = new I18NService(en, de, hu, fr, es)

const TranslatedComponent = createI18nComponent({
  service,
  tagName: 'i18n-page-translated-component',
})
```

Usage:

```tsx
<TranslatedComponent id="greeting" key="greeting" />
<TranslatedComponent id="farewell" key="farewell" />
```
