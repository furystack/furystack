import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services'
import type { SuggestManager } from './suggest-manager'

export const SuggestInput = Shade<{ manager: SuggestManager<any> }>({
  shadowDomName: 'shades-suggest-input',
  render: ({ element, props, useObservable, injector }) => {
    const { theme } = injector.getInstance(ThemeProviderService)

    element.style.width = '100%'
    element.style.overflow = 'hidden'

    useObservable(
      'isOpened',
      props.manager.isOpened,
      (isOpened) => {
        const input = element.firstChild as HTMLInputElement
        if (isOpened) {
          input.focus()
        } else {
          input.value = ''
        }
      },
      true,
    )

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
