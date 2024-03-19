import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import type { SuggestManager } from './suggest-manager.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'

export const SuggestionList: <T>(props: { manager: SuggestManager<T> }, children: ChildrenList) => JSX.Element<any> =
  Shade<{ manager: SuggestManager<any> }>({
    shadowDomName: 'shade-suggest-suggestion-list',
    render: ({ element, props, injector, useObservable }) => {
      const { manager } = props
      const { theme } = injector.getInstance(ThemeProviderService)

      const [suggestions] = useObservable('suggestions', manager.currentSuggestions)

      // todo: GetLast is eliminated, do we need it?
      const [selectedIndex] = useObservable('selectedIndex', manager.selectedIndex, (idx) => {
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

      const [isListOpened] = useObservable('isOpened', manager.isOpened, async (isOpened) => {
        const container = element.firstElementChild as HTMLDivElement
        if (isOpened) {
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
        }
      })

      return (
        <div
          className="suggestion-items-container"
          style={{
            borderTop: 'none',
            position: 'absolute',
            borderRadius: '0px 0px 5px 5px',
            marginLeft: '14px',
            overflow: 'hidden',
            zIndex: '1',
            left: 'auto',
            backgroundColor: theme.background.paper, //'rgba(8,8,8,0.85)',
            color: theme.text.secondary,
            boxShadow: '3px 3px 5px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(15px)',
            width: `calc(${Math.round(element.parentElement?.getBoundingClientRect().width || 200)}px - 3em)`,
          }}
        >
          {suggestions.map((s, i) => (
            <div
              className="suggestion-item"
              onclick={() => {
                isListOpened && manager.selectSuggestion(i)
              }}
              style={{
                padding: '1em',
                cursor: 'default',
                background: i === selectedIndex ? theme.background.paper : theme.background.default,
                fontWeight: i === selectedIndex ? 'bolder' : 'normal',
              }}
            >
              {s.suggestion.element}
            </div>
          ))}
        </div>
      )
    },
  })
