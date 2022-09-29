import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation'
import type { CommandPaletteManager } from './command-palette-manager'

export const CommandPaletteInput = Shade<{ manager: CommandPaletteManager }, { isOpened: boolean }>({
  getInitialState: ({ props }) => ({ isOpened: props.manager.isOpened.getValue() }),
  constructed: ({ element, props }) => {
    const { manager } = props
    const subscriptions = [
      manager.isOpened.subscribe(async (isOpened) => {
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
      }),
    ]
    return () => subscriptions.map((s) => s.dispose())
  },
  shadowDomName: 'shades-command-palette-input',
  render: ({ element, props }) => {
    const { manager } = props
    element.style.width = manager.isOpened.getValue() ? '100%' : '0%'
    element.style.overflow = 'hidden'
    return (
      <input
        autofocus
        style={{
          color: 'white',
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
