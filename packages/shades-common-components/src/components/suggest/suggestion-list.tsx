import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import type { SuggestManager } from './suggest-manager.js'

export const SuggestionList: <T>(props: { manager: SuggestManager<T> }, children: ChildrenList) => JSX.Element<any> =
  Shade<{ manager: SuggestManager<any> }>({
    shadowDomName: 'shade-suggest-suggestion-list',
    render: ({ element, props, injector, useObservable }) => {
      const { manager } = props
      const { theme } = injector.getInstance(ThemeProviderService)

      const [suggestions] = useObservable('suggestions', manager.currentSuggestions)

      // todo: GetLast is eliminated, do we need it?
      const [selectedIndex] = useObservable('selectedIndex', manager.selectedIndex, {
        onChange: (idx) => {
          ;([...element.querySelectorAll('.suggestion-item')] as HTMLDivElement[]).map((s, i) => {
            if (i === idx) {
              s.style.background = 'rgba(128,128,128,0.2)'
              s.style.fontWeight = '500'
              s.style.borderLeft = `3px solid ${theme.text.primary}`
            } else {
              s.style.background = 'transparent'
              s.style.fontWeight = '400'
              s.style.borderLeft = '3px solid transparent'
            }
          })
        },
      })

      const [isListOpened] = useObservable('isOpened', manager.isOpened, {
        onChange: (isOpened) => {
          const container = element.firstElementChild as HTMLDivElement
          if (isOpened) {
            container.style.zIndex = '1'
            container.style.width = `calc(${Math.round(
              element.parentElement?.getBoundingClientRect().width || 200,
            )}px - 3em)`
            void promisifyAnimation(
              container,
              [
                { opacity: 0, transform: 'translate(0, -50px)' },
                { opacity: 1, transform: 'translate(0, 0)' },
              ],
              { fill: 'forwards', duration: 500 },
            )
          } else {
            void promisifyAnimation(
              container,
              [
                { opacity: 1, transform: 'translate(0, 0)' },
                { opacity: 0, transform: 'translate(0, -50px)' },
              ],
              { fill: 'forwards', duration: 200 },
            )
            container.style.zIndex = '-1'
          }
        },
      })

      return (
        <div
          className="suggestion-items-container"
          style={{
            borderTop: 'none',
            position: 'absolute',
            borderRadius: '0px 0px 12px 12px',
            marginLeft: '14px',
            marginTop: '4px',
            overflow: 'hidden',
            zIndex: '1',
            left: 'auto',
            backgroundColor: theme.background.paper,
            color: theme.text.secondary,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(128,128,128,0.2)',
            width: `calc(${Math.round(element.parentElement?.getBoundingClientRect().width || 200)}px - 3em)`,
          }}
        >
          {suggestions.map((s, i) => (
            <div
              className="suggestion-item"
              onclick={() => {
                if (isListOpened) {
                  manager.selectSuggestion(i)
                }
              }}
              onmouseenter={(ev) => {
                if (i !== selectedIndex) {
                  ;(ev.target as HTMLElement).style.background = 'rgba(128,128,128,0.1)'
                }
              }}
              onmouseleave={(ev) => {
                if (i !== selectedIndex) {
                  ;(ev.target as HTMLElement).style.background = 'transparent'
                }
              }}
              style={{
                padding: '0.875em 1.25em',
                cursor: 'pointer',
                background: i === selectedIndex ? 'rgba(128,128,128,0.2)' : 'transparent',
                fontWeight: i === selectedIndex ? '500' : '400',
                borderLeft: i === selectedIndex ? `3px solid ${theme.text.primary}` : '3px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.95em',
                letterSpacing: '0.01em',
              }}
            >
              {s.suggestion.element}
            </div>
          ))}
        </div>
      )
    },
  })
