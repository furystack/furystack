import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation'
import { Loader } from '../loader'
import { CommandPaletteManager } from './command-palette-manager'
import { CommandPaletteInput } from './command-palette-input'
import { CommandPaletteSuggestionList } from './command-palette-suggestion-list'
import { CommandProvider } from './command-provider'
import { ClickAwayService } from '../../services/click-away-service'

export * from './command-palette-input'
export * from './command-palette-manager'
export * from './command-palette-suggestion-list'
export * from './command-provider'

export interface CommandPaletteProps {
  commandProviders: CommandProvider[]
  defaultPrefix: string
  style?: Partial<CSSStyleDeclaration>
  fullScreenSuggestions?: boolean
}

export interface CommandPaletteState {
  manager: CommandPaletteManager
}

export const CommandPalette = Shade<CommandPaletteProps, CommandPaletteState>({
  shadowDomName: 'shade-command-palette',
  getInitialState: ({ props }) => ({
    manager: new CommandPaletteManager(props.commandProviders),
  }),
  resources: ({ getState, element: rootElement }) => {
    const { manager } = getState()
    const element = rootElement.querySelector('.input-container') as HTMLDivElement
    const clickAwayListener = new ClickAwayService(rootElement, () => manager.isOpened.setValue(false))
    return [
      manager.isOpened.subscribe((isOpened) => {
        const suggestions = rootElement.querySelector('.close-suggestions')
        const postControls = rootElement.querySelector('.post-controls')
        if (isOpened) {
          promisifyAnimation(suggestions, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 500,
            fill: 'forwards',
          })

          promisifyAnimation(postControls, [{ width: '0px' }, { width: '50px' }], {
            duration: 100,
            fill: 'forwards',
          })

          promisifyAnimation(element, [{ background: 'transparent' }, { background: 'rgba(128,128,128,0.1)' }], {
            duration: 500,
            fill: 'forwards',
            easing: 'cubic-bezier(0.050, 0.570, 0.840, 1.005)',
          })
        } else {
          promisifyAnimation(suggestions, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 500,
            fill: 'forwards',
          })

          promisifyAnimation(postControls, [{ width: '50px' }, { width: '0px' }], {
            duration: 500,
            fill: 'forwards',
            delay: 300,
          })

          promisifyAnimation(element, [{ background: 'rgba(128,128,128,0.1)' }, { background: 'transparent' }], {
            duration: 300,
            fill: 'forwards',
            easing: 'cubic-bezier(0.000, 0.245, 0.190, 0.790)',
          })
        }
      }),
      manager.isLoading.subscribe(async (isLoading) => {
        const loader = rootElement.querySelector('.loader-container')
        if (isLoading) {
          promisifyAnimation(loader, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 100,
            fill: 'forwards',
          })
        } else {
          promisifyAnimation(loader, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 100,
            fill: 'forwards',
          })
        }
      }),
      clickAwayListener,
      manager,
    ]
  },
  render: ({ props, injector, element, getState }) => {
    element.style.flexGrow = '1'
    const { manager } = getState()
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column' }}
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

          manager.getSuggestion({ injector, term: (ev.target as any).value })
        }}
      >
        <div
          className="input-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 1em',
            borderRadius: '5px',
            position: 'relative',
            ...props.style,
          }}
        >
          <div
            className="term-icon"
            style={{
              cursor: 'pointer',
              color: '#aaa',
              fontWeight: 'bolder',
              textShadow: '0 0 1px #aaa',
            }}
            onclick={() => manager.isOpened.setValue(true)}
          >
            {props.defaultPrefix}
          </div>
          <CommandPaletteInput manager={manager} />
          <div
            className="post-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: manager.isOpened.getValue() ? '50px' : '0px',
              overflow: 'hidden',
            }}
          >
            <div
              className="loader-container"
              style={{ width: '20px', height: '20px', opacity: manager.isLoading.getValue() ? '1' : '0' }}
            >
              <Loader style={{ width: '100%', height: '100%' }} />
            </div>
            <div
              className="close-suggestions"
              onclick={() => manager.isOpened.setValue(false)}
              style={{
                width: '20px',
                height: '20px',
                opacity: manager.isOpened.getValue() ? '1' : '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✖
            </div>
          </div>
        </div>
        <CommandPaletteSuggestionList manager={manager} fullScreenSuggestions={props.fullScreenSuggestions} />
      </div>
    )
  },
})
