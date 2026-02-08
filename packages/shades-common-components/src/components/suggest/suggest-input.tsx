import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { SuggestManager } from './suggest-manager.js'

export const SuggestInput = Shade<{ manager: SuggestManager<any> }>({
  tagName: 'shades-suggest-input',
  css: {
    width: '100%',
    overflow: 'hidden',
    '& input': {
      color: cssVariableTheme.text.primary,
      outline: 'none',
      padding: '0.875em 0.5em',
      background: 'transparent',
      border: 'none',
      display: 'inline-flex',
      width: 'calc(100% - 1em)',
      fontSize: '0.95em',
      fontWeight: '400',
      letterSpacing: '0.01em',
    },
  },
  render: ({ element, props, useObservable }) => {
    useObservable('isOpened', props.manager.isOpened, {
      onChange: (isOpened) => {
        const input = element.firstChild as HTMLInputElement
        if (isOpened) {
          input.focus()
        } else {
          input.value = ''
        }
      },
    })

    return <input autofocus placeholder="Type to search..." />
  },
})
