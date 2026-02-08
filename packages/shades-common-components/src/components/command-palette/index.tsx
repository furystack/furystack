import { Shade, createComponent } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import { Loader } from '../loader.js'
import { searchableInputStyles } from '../searchable-input-styles.js'
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
    ...searchableInputStyles,
    '& .command-palette-wrapper': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .loader-container': {
      width: '20px',
      height: '20px',
      opacity: '0',
    },
    '&.loading .loader-container': {
      opacity: '1',
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
