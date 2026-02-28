import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { CommandPaletteManager } from './command-palette-manager.js'

export const CommandPaletteInput = Shade<{ manager: CommandPaletteManager }>({
  shadowDomName: 'shades-command-palette-input',
  css: {
    width: '100%',
    fontFamily: cssVariableTheme.typography.fontFamily,
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
  render: ({ props, useObservable, useRef }) => {
    const inputRef = useRef<HTMLInputElement>('input')
    useObservable('isOpened', props.manager.isOpened, {
      onChange: (isOpened) => {
        if (inputRef.current) {
          if (isOpened) {
            inputRef.current.focus()
          } else {
            inputRef.current.value = ''
          }
        }
      },
    })

    return <input ref={inputRef} autofocus placeholder="Type to search commands..." />
  },
})
