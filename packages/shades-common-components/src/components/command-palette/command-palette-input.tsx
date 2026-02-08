import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import type { CommandPaletteManager } from './command-palette-manager.js'

const updateComponent = async (element: HTMLElement, isOpened: boolean) => {
  const input = element.firstChild as HTMLInputElement | null
  if (input) {
    if (isOpened) {
      input.value = ''
      await promisifyAnimation(element, [{ width: '0%' }, { width: '100%' }], {
        duration: 300,
        fill: 'forwards',
        easing: 'cubic-bezier(0.595, 0.425, 0.415, 0.845)',
      })
      input.focus()
    } else {
      await promisifyAnimation(element, [{ width: '100%' }, { width: '0%' }], {
        duration: 300,
        fill: 'forwards',
        easing: 'cubic-bezier(0.595, 0.425, 0.415, 0.845)',
      })
      input.value = ''
    }
  }
}

export const CommandPaletteInput = Shade<{ manager: CommandPaletteManager }>({
  tagName: 'shades-command-palette-input',
  css: {
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
    const { manager } = props

    const [isCurrentlyOpened] = useObservable('isOpened', manager.isOpened, {
      onChange: (newValue) => void updateComponent(element, newValue),
    })
    element.style.width = isCurrentlyOpened ? '100%' : '0%'

    return <input autofocus placeholder="Type to search commands..." />
  },
})
