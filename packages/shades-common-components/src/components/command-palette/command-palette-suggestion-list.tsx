import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation'
import { CommandPaletteSuggestionResult } from './command-provider'
import { CommandPaletteManager } from './command-palette-manager'
import { ThemeProviderService } from '../../services/theme-provider-service'

export const CommandPaletteSuggestionList = Shade<
  { manager: CommandPaletteManager; fullScreenSuggestions?: boolean },
  { suggestions: CommandPaletteSuggestionResult[] }
>({
  shadowDomName: 'shade-command-palette-suggestion-list',
  getInitialState: ({ props }) => ({
    suggestions: props.manager.currentSuggestions.getValue(),
  }),
  constructed: ({ updateState, element, props }) => {
    const { manager } = props
    const subscriptions = [
      manager.currentSuggestions.subscribe((suggestions) => {
        updateState({ suggestions })
      }),
      manager.isOpened.subscribe(async (isOpened) => {
        const container = element.firstElementChild as HTMLDivElement
        if (isOpened) {
          container.style.display = 'initial'
          container.style.zIndex = '1'
          container.style.width = `calc(${Math.round(
            element.parentElement?.getBoundingClientRect().width || 200,
          )}px - 3em)`
          await promisifyAnimation(
            container,
            [
              { opacity: 0, transform: 'translate(0, -50px)' },
              { opacity: 1, transform: 'translate(0, 0)' },
            ],
            { fill: 'forwards', duration: 500 },
          )
        } else {
          await promisifyAnimation(
            container,
            [
              { opacity: 1, transform: 'translate(0, 0)' },
              { opacity: 0, transform: 'translate(0, -50px)' },
            ],
            { fill: 'forwards', duration: 200 },
          )
          container.style.zIndex = '-1'
          container.style.display = 'none'
        }
      }),
      manager.selectedIndex.subscribe((idx) => {
        ;[...element.querySelectorAll('.suggestion-item')].map((s, i) => {
          if (i === idx) {
            ;(s as HTMLDivElement).style.background = 'rgba(128,128,128,0.2)'
          } else {
            ;(s as HTMLDivElement).style.background = 'rgba(96,96,96,0.2)'
          }
        })
      }),
    ]
    return () => subscriptions.map((s) => s.dispose())
  },
  render: ({ element, injector, getState, props }) => {
    const { manager } = props
    return (
      <div
        className="suggestion-items-container"
        style={{
          borderTop: 'none',
          position: 'absolute',
          opacity: manager.isOpened.getValue() ? '1' : '0',
          borderRadius: '0px 0px 5px 5px',
          marginLeft: '14px',
          overflow: 'hidden',
          overflowY: 'auto',
          maxHeight: `${window.innerHeight * 0.8}px`,
          zIndex: '1',
          left: 'auto',
          backgroundColor: injector.getInstance(ThemeProviderService).theme.getValue().background.paper,
          boxShadow: '3px 3px 5px rgba(0,0,0,0.3)',
          width: `calc(${Math.round(element.parentElement?.getBoundingClientRect().width || 200)}px - 3em)`,
          ...(props.fullScreenSuggestions ? { left: '0', width: 'calc(100% - 42px)' } : {}),
        }}>
        {getState().suggestions.map((s, i) => (
          <div
            className="suggestion-item"
            onclick={() => {
              manager.isOpened.getValue() && manager.selectSuggestion(injector, i)
            }}
            style={{
              padding: '1em',
              cursor: 'default',
              background: i === manager.selectedIndex.getValue() ? 'rgba(128,128,128,0.2)' : 'transparent',
            }}>
            {s.element}
          </div>
        ))}
      </div>
    )
  },
})
