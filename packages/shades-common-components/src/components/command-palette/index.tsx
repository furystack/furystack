import { Shade, createComponent } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import { Loader } from '../loader.js'
import { CommandPaletteInput } from './command-palette-input.js'
import { CommandPaletteManager } from './command-palette-manager.js'
import { CommandPaletteSuggestionList } from './command-palette-suggestion-list.js'
import type { CommandProvider } from './command-provider.js'

export * from './command-palette-input.js'
export * from './command-palette-manager.js'
export * from './command-palette-suggestion-list.js'
export * from './command-provider.js'

export interface CommandPaletteProps {
  commandProviders: CommandProvider[]
  defaultPrefix: string
  style?: Partial<CSSStyleDeclaration>
  fullScreenSuggestions?: boolean
}

export const CommandPalette = Shade<CommandPaletteProps>({
  shadowDomName: 'shade-command-palette',
  css: {
    flexGrow: '1',
    '& .command-palette-wrapper': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .input-container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 1.25em',
      borderRadius: '12px',
      position: 'relative',
      background: 'rgba(128,128,128,0.08)',
      border: '1px solid rgba(128,128,128,0.15)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    '&.opened .input-container': {
      border: '1px solid rgba(128,128,128,0.3)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 3px rgba(128,128,128,0.05)',
    },
    '& .term-icon': {
      cursor: 'pointer',
      color: cssVariableTheme.text.secondary,
      fontWeight: '600',
      fontSize: '0.95em',
      transition: 'color 0.2s ease',
      padding: '0.5em 0.75em 0.5em 0',
      userSelect: 'none',
    },
    '& .term-icon:hover': {
      color: cssVariableTheme.text.primary,
    },
    '& .post-controls': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '0px',
      overflow: 'hidden',
    },
    '&.opened .post-controls': {
      width: '50px',
    },
    '& .loader-container': {
      width: '20px',
      height: '20px',
      opacity: '0',
    },
    '&.loading .loader-container': {
      opacity: '1',
    },
    '& .close-suggestions': {
      width: '24px',
      height: '24px',
      opacity: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      fontSize: '14px',
      color: cssVariableTheme.text.secondary,
      background: 'transparent',
      transform: 'scale(1)',
    },
    '&.opened .close-suggestions': {
      opacity: '1',
    },
    '& .close-suggestions:hover': {
      background: 'rgba(255,255,255,0.15)',
      transform: 'scale(1.1)',
    },
  },
  render: ({ props, injector, element, useState, useDisposable, useObservable }) => {
    const [manager] = useState('manager', new CommandPaletteManager(props.commandProviders))

    useDisposable('clickAwayService', () => new ClickAwayService(element, () => manager.isOpened.setValue(false)))

    useObservable('isLoading', manager.isLoading, {
      onChange: (isLoading) => {
        element.classList.toggle('loading', isLoading)
      },
    })

    const [isOpenedAtRender, setIsOpened] = useObservable('isOpened', manager.isOpened, {
      onChange: (isOpened) => {
        element.classList.toggle('opened', isOpened)
        const inputContainer = element.querySelector('.input-container') as HTMLDivElement
        if (isOpened) {
          void promisifyAnimation(
            inputContainer,
            [{ background: 'transparent' }, { background: cssVariableTheme.background.default }],
            {
              duration: 500,
              fill: 'forwards',
              easing: 'cubic-bezier(0.050, 0.570, 0.840, 1.005)',
            },
          )
        } else {
          void promisifyAnimation(
            inputContainer,
            [{ background: cssVariableTheme.background.default }, { background: 'transparent' }],
            {
              duration: 300,
              fill: 'forwards',
              easing: 'cubic-bezier(0.000, 0.245, 0.190, 0.790)',
            },
          )
        }
      },
    })

    if (isOpenedAtRender) {
      element.classList.add('opened')
    }

    return (
      <div
        className="command-palette-wrapper"
        onkeyup={(ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault()
            manager.selectSuggestion(injector)
            return
          }
          if (ev.key === 'ArrowUp') {
            ev.preventDefault()
            manager.selectedIndex.setValue(Math.max(0, manager.selectedIndex.getValue() - 1))
          }
          if (ev.key === 'ArrowDown') {
            ev.preventDefault()
            manager.selectedIndex.setValue(
              Math.min(manager.selectedIndex.getValue() + 1, manager.currentSuggestions.getValue().length - 1),
            )
          }

          void manager.getSuggestion({ injector, term: (ev.target as HTMLInputElement).value })
        }}
      >
        <div className="input-container" style={props.style}>
          <div className="term-icon" onclick={() => setIsOpened(true)}>
            {props.defaultPrefix}
          </div>
          <CommandPaletteInput manager={manager} />
          <div className="post-controls">
            <div className="loader-container">
              <Loader style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="close-suggestions" onclick={() => setIsOpened(false)}>
              ✖
            </div>
          </div>
        </div>
        <CommandPaletteSuggestionList manager={manager} fullScreenSuggestions={props.fullScreenSuggestions} />
      </div>
    )
  },
})
