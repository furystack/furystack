import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import type { CommandPaletteManager } from './command-palette-manager.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'

export const CommandPaletteSuggestionList = Shade<{ manager: CommandPaletteManager; fullScreenSuggestions?: boolean }>({
  shadowDomName: 'shade-command-palette-suggestion-list',
  render: ({ element, injector, props, useObservable }) => {
    const { manager } = props
    const { theme } = injector.getInstance(ThemeProviderService)

    const [suggestions] = useObservable('suggestions', props.manager.currentSuggestions)
    const [selectedIndex] = useObservable('selectedIndex', props.manager.selectedIndex, (idx) => {
      ;([...element.querySelectorAll('.suggestion-item')] as HTMLDivElement[]).map((s, i) => {
        if (i === idx) {
          s.style.background = theme.background.paper
          s.style.fontWeight = 'bolder'
        } else {
          s.style.background = theme.background.default
          s.style.fontWeight = 'normal'
        }
      })
    })

    const [isOpenedAtRender] = useObservable('isOpenedAtRender', props.manager.isOpened, async (isOpened) => {
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
    })

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
          backgroundColor: theme.background.paper,
          boxShadow: '3px 3px 5px rgba(0,0,0,0.3)',
          width: `calc(${Math.round(element.parentElement?.getBoundingClientRect().width || 200)}px - 3em)`,
          ...(props.fullScreenSuggestions ? { left: '0', width: 'calc(100% - 42px)' } : {}),
        }}
      >
        {suggestions.map((s, i) => (
          <div
            className="suggestion-item"
            onclick={() => {
              isOpenedAtRender && manager.selectSuggestion(injector, i)
            }}
            style={{
              padding: '1em',
              cursor: 'default',
              background: i === selectedIndex ? theme.background.paper : theme.background.default,
              fontWeight: i === selectedIndex ? 'bolder' : 'normal',
            }}
          >
            {s.element}
          </div>
        ))}
      </div>
    )
  },
})
