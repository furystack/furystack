import { Shade, createComponent } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
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
  render: ({ props, injector, element, useState, useDisposable, useObservable }) => {
    element.style.flexGrow = '1'
    const [manager] = useState('manager', new CommandPaletteManager(props.commandProviders))
    const { theme } = injector.getInstance(ThemeProviderService)

    useDisposable('clickAwayService', () => new ClickAwayService(element, () => manager.isOpened.setValue(false)))

    const [isLoadingAtRender] = useObservable('isLoading', manager.isLoading, {
      onChange: (isLoading) => {
        const loader = element.querySelector('.loader-container')
        if (isLoading) {
          void promisifyAnimation(loader, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 100,
            fill: 'forwards',
          })
        } else {
          void promisifyAnimation(loader, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 100,
            fill: 'forwards',
          })
        }
      },
    })

    const [isOpenedAtRender, setIsOpened] = useObservable('isOpened', manager.isOpened, {
      onChange: (isOpened) => {
        {
          const suggestions = element.querySelector('.close-suggestions')
          const postControls = element.querySelector('.post-controls')
          const inputContainer = element.querySelector('.input-container') as HTMLDivElement
          if (isOpened) {
            void promisifyAnimation(suggestions, [{ opacity: 0 }, { opacity: 1 }], {
              duration: 500,
              fill: 'forwards',
            })

            void promisifyAnimation(postControls, [{ width: '0px' }, { width: '50px' }], {
              duration: 100,
              fill: 'forwards',
            })

            void promisifyAnimation(
              inputContainer,
              [{ background: 'transparent' }, { background: theme.background.default }],
              {
                duration: 500,
                fill: 'forwards',
                easing: 'cubic-bezier(0.050, 0.570, 0.840, 1.005)',
              },
            )
          } else {
            void promisifyAnimation(suggestions, [{ opacity: 1 }, { opacity: 0 }], {
              duration: 500,
              fill: 'forwards',
            })

            void promisifyAnimation(postControls, [{ width: '50px' }, { width: '0px' }], {
              duration: 500,
              fill: 'forwards',
              delay: 300,
            })

            void promisifyAnimation(
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
      },
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

          void manager.getSuggestion({ injector, term: (ev.target as HTMLInputElement).value })
        }}
      >
        <div
          className="input-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 1.25em',
            borderRadius: '12px',
            position: 'relative',
            background: 'rgba(128,128,128,0.08)',
            border: `1px solid ${manager.isOpened.getValue() ? 'rgba(128,128,128,0.3)' : 'rgba(128,128,128,0.15)'}`,
            boxShadow: manager.isOpened.getValue()
              ? '0 4px 12px rgba(0,0,0,0.15), 0 0 0 3px rgba(128,128,128,0.05)'
              : '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            ...props.style,
          }}
        >
          <div
            className="term-icon"
            style={{
              cursor: 'pointer',
              color: theme.text.secondary,
              fontWeight: '600',
              fontSize: '0.95em',
              transition: 'color 0.2s ease',
              padding: '0.5em 0.75em 0.5em 0',
              userSelect: 'none',
            }}
            onmouseenter={(ev) => {
              ;(ev.target as HTMLElement).style.color = theme.text.primary
            }}
            onmouseleave={(ev) => {
              ;(ev.target as HTMLElement).style.color = theme.text.secondary
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
              onmouseenter={(ev) => {
                ;(ev.target as HTMLElement).style.background = 'rgba(255,255,255,0.15)'
                ;(ev.target as HTMLElement).style.transform = 'scale(1.1)'
              }}
              onmouseleave={(ev) => {
                ;(ev.target as HTMLElement).style.background = 'transparent'
                ;(ev.target as HTMLElement).style.transform = 'scale(1)'
              }}
              style={{
                width: '24px',
                height: '24px',
                opacity: manager.isOpened.getValue() ? '1' : '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                color: theme.text.secondary,
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
