import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation'
import { Loader } from '../loader'
import { CommandPaletteManager } from './command-palette-manager'
import { CommandPaletteInput } from './command-palette-input'
import { CommandPaletteSuggestionList } from './command-palette-suggestion-list'
import type { CommandProvider } from './command-provider'
import { ClickAwayService } from '../../services/click-away-service'
import { ThemeProviderService } from '../../services'

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

export const CommandPalette = Shade<CommandPaletteProps>({
  shadowDomName: 'shade-command-palette',
  render: ({ props, injector, element, useState, useDisposable, useObservable }) => {
    element.style.flexGrow = '1'
    const [manager] = useState('manager', new CommandPaletteManager(props.commandProviders))
    const { theme } = injector.getInstance(ThemeProviderService)

    useDisposable('clickAwayService', () => new ClickAwayService(element, () => manager.isOpened.setValue(false)))

    const [isLoadingAtRender] = useObservable('isLoading', manager.isLoading, async (isLoading) => {
      const loader = element.querySelector('.loader-container')
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
    })

    const [isOpenedAtRender, setIsOpened] = useObservable('isOpened', manager.isOpened, (isOpened) => {
      {
        const suggestions = element.querySelector('.close-suggestions')
        const postControls = element.querySelector('.post-controls')
        const inputContainer = element.querySelector('.input-container') as HTMLDivElement
        if (isOpened) {
          promisifyAnimation(suggestions, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 500,
            fill: 'forwards',
          })

          promisifyAnimation(postControls, [{ width: '0px' }, { width: '50px' }], {
            duration: 100,
            fill: 'forwards',
          })

          promisifyAnimation(
            inputContainer,
            [{ background: 'transparent' }, { background: theme.background.default }],
            {
              duration: 500,
              fill: 'forwards',
              easing: 'cubic-bezier(0.050, 0.570, 0.840, 1.005)',
            },
          )
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

          promisifyAnimation(
            inputContainer,
            [{ background: theme.background.default }, { background: 'transparent' }],
            {
              duration: 300,
              fill: 'forwards',
              easing: 'cubic-bezier(0.000, 0.245, 0.190, 0.790)',
            },
          )
        }
      }
    })

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
            onclick={() => setIsOpened(true)}
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
              width: isOpenedAtRender ? '50px' : '0px',
              overflow: 'hidden',
            }}
          >
            <div
              className="loader-container"
              style={{ width: '20px', height: '20px', opacity: isLoadingAtRender ? '1' : '0' }}
            >
              <Loader style={{ width: '100%', height: '100%' }} />
            </div>
            <div
              className="close-suggestions"
              onclick={() => setIsOpened(false)}
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
