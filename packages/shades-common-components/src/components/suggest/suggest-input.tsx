import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import type { SuggestManager } from './suggest-manager.js'

export const SuggestInput = Shade<{ manager: SuggestManager<any> }>({
  shadowDomName: 'shades-suggest-input',
  style: {
    width: '100%',
    overflow: 'hidden',
  },
  render: ({ element, props, useObservable, injector }) => {
    const { theme } = injector.getInstance(ThemeProviderService)

    // todo: getLast is eliminated, do we need it?
    useObservable('isOpened', props.manager.isOpened, (isOpened) => {
      const input = element.firstChild as HTMLInputElement
      if (isOpened) {
        input.focus()
      } else {
        input.value = ''
      }
    })

    return (
      <input
        autofocus
        style={{
          color: theme.text.primary,
          outline: 'none',
          padding: '1em',
          background: 'transparent',
          border: 'none',
          display: 'inline-flex',
          width: 'calc(100% - 2em)',
        }}
      />
    )
  },
})
