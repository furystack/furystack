import type { RefObject } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import type { CommandPaletteManager } from './command-palette-manager.js'

const animateOpenState = async (
  wrapperRef: RefObject<HTMLDivElement>,
  inputRef: RefObject<HTMLInputElement>,
  isOpened: boolean,
) => {
  const wrapper = wrapperRef.current
  const input = inputRef.current
  if (wrapper && input) {
    if (isOpened) {
      input.value = ''
      await promisifyAnimation(wrapper, [{ width: '0%' }, { width: '100%' }], {
        duration: 300,
        fill: 'forwards',
        easing: 'cubic-bezier(0.595, 0.425, 0.415, 0.845)',
      })
      input.focus()
    } else {
      await promisifyAnimation(wrapper, [{ width: '100%' }, { width: '0%' }], {
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
  render: ({ props, useObservable, useRef, useHostProps }) => {
    const { manager } = props
    const wrapperRef = useRef<HTMLDivElement>('wrapper')
    const inputRef = useRef<HTMLInputElement>('input')

    const [isCurrentlyOpened] = useObservable('isOpened', manager.isOpened, {
      onChange: (newValue) => void animateOpenState(wrapperRef, inputRef, newValue),
    })
    useHostProps({ style: { width: isCurrentlyOpened ? '100%' : '0%' } })

    return (
      <div ref={wrapperRef} style={{ width: isCurrentlyOpened ? '100%' : '0%', overflow: 'hidden' }}>
        <input ref={inputRef} autofocus placeholder="Type to search commands..." />
      </div>
    )
  },
})
