import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services'
import { promisifyAnimation } from '../../utils/promisify-animation'
import type { CommandPaletteManager } from './command-palette-manager'

export const CommandPaletteInput = Shade<{ manager: CommandPaletteManager }>({
  shadowDomName: 'shades-command-palette-input',
  render: ({ element, props, injector, useObservable }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    const { manager } = props

    useObservable(
      'isOpened',
      manager.isOpened,
      async (isOpened) => {
        const input = element.firstChild as HTMLInputElement
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
      },
      true,
    )

    element.style.width = manager.isOpened.getValue() ? '100%' : '0%'
    element.style.overflow = 'hidden'
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
