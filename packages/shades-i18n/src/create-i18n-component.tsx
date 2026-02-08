import type { I18NService } from '@furystack/i18n'
import { createComponent, Shade } from '@furystack/shades'

export const createI18nComponent = <TKeys extends string>(options: {
  service: I18NService<TKeys>
  tagName: string
}) => {
  return Shade<{ key: TKeys }>({
    tagName: options.tagName,
    elementBase: HTMLSpanElement,
    elementBaseName: 'span',
    render: ({ props, useDisposable, useState }) => {
      const [value, setValue] = useState('currentValue', options.service.translate(props.key))

      useDisposable('onLanguageChange', () =>
        options.service.subscribe('languageChange', (newLanguageCode) => {
          setValue(options.service.translate(props.key, newLanguageCode))
        }),
      )

      return <>{value}</>
    },
  })
}
