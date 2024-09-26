import { createLanguage, I18NService } from '@furystack/i18n'
import { createComponent, Shade } from '@furystack/shades'
import { createI18nComponent } from '@furystack/shades-i18n'
import de from './de.json' with { type: 'json' }
import en from './en.json' with { type: 'json' }
import es from './es.json' with { type: 'json' }

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

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const service = new I18NService(en, de, hu, fr, es)

const TranslatedComponent = createI18nComponent({
  service,
  shadowDomName: 'i18n-page-translated-component',
})

export const I18NPage = Shade({
  shadowDomName: 'i18n-page',
  render: () => {
    return (
      <>
        <h1>I18N</h1>
        <div style={{ paddingBottom: '1em' }}>
          Select language: &nbsp;
          <select
            name="currentLanguage"
            onchange={(e) => (service.currentLanguage = (e.target as HTMLOptionElement).value)}
          >
            {service.getAvailableLanguageCodes().map((code) => (
              <option selected={code === service.currentLanguage} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <TranslatedComponent id="greeting" key="greeting" /> &nbsp;
        <TranslatedComponent id="farewell" key="farewell" />
      </>
    )
  },
})
