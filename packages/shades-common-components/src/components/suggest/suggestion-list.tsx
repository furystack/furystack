import { Shade, createComponent, ChildrenList } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation'
import { SuggestionResult } from './suggestion-result'
import { SuggestManager } from './suggest-manager'

export const SuggestionList: <T>(
  props: { manager: SuggestManager<T> },
  children: ChildrenList,
) => JSX.Element<any, any> = Shade<{ manager: SuggestManager<any> }, { suggestions: SuggestionResult[] }>({
  shadowDomName: 'shade-suggest-suggestion-list',
  getInitialState: ({ props }) => ({
    suggestions: props.manager.currentSuggestions.getValue().map((v) => v.suggestion),
  }),
  resources: ({ updateState, element, props }) => [
    props.manager.currentSuggestions.subscribe((s) => {
      updateState({ suggestions: s.map((ss) => ss.suggestion) })
    }),
    props.manager.isOpened.subscribe(async (isOpened) => {
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
    }, true), // TODO: Check initial state
    props.manager.selectedIndex.subscribe((idx) => {
      ;[...element.querySelectorAll('.suggestion-item')].map((s, i) => {
        if (i === idx) {
          ;(s as HTMLDivElement).style.background = 'rgba(128,128,128,0.2)'
        } else {
          ;(s as HTMLDivElement).style.background = 'rgba(96,96,96,0.2)'
        }
      })
    }),
  ],
  render: ({ element, getState, props }) => {
    const { manager } = props
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
          backgroundColor: 'rgba(8,8,8,0.85)',
          boxShadow: '3px 3px 5px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(15px)',
          width: `calc(${Math.round(element.parentElement?.getBoundingClientRect().width || 200)}px - 3em)`,
        }}
      >
        {getState().suggestions.map((s, i) => (
          <div
            className="suggestion-item"
            onclick={() => {
              manager.isOpened.getValue() && manager.selectSuggestion(i)
            }}
            style={{
              padding: '1em',
              cursor: 'default',
              background: i === manager.selectedIndex.getValue() ? 'rgba(128,128,128,0.2)' : 'rgba(96,96,96,0.2)',
            }}
          >
            {s.element}
          </div>
        ))}
      </div>
    )
  },
})
