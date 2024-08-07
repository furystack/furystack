import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
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
  shadowDomName: 'shades-command-palette-input',
  render: ({ element, props, injector, useObservable }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    const { manager } = props

    const [isCurrentlyOpened] = useObservable('isOpened', manager.isOpened, {
      onChange: (newValue) => void updateComponent(element, newValue),
    })
    element.style.width = isCurrentlyOpened ? '100%' : '0%'
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
