import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../../utils/promisify-animation'
import { Loader } from '../loader'
import { SuggestManager } from './suggest-manager'
import type { SuggestionResult } from './suggestion-result'
import { SuggestInput } from './suggest-input'
import { SuggestionList } from './suggestion-list'

export * from './suggest-input'
export * from './suggest-manager'
export * from './suggestion-list'
export * from './suggestion-result'

export interface SuggestProps<T> {
  defaultPrefix: string
  getEntries: (term: string) => Promise<T[]>
  getSuggestionEntry: (entry: T) => SuggestionResult
  onSelectSuggestion: (entry: T) => void
  style?: Partial<CSSStyleDeclaration>
}

export interface SuggestState<T> {
  manager: SuggestManager<T>
}

export const Suggest: <T>(props: SuggestProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  SuggestProps<any>,
  SuggestState<any>
>({
  shadowDomName: 'shade-suggest',
  getInitialState: ({ props }) => ({
    manager: new SuggestManager(props.getEntries, props.getSuggestionEntry),
  }),
  constructed: ({ element: el, getState, props }) => {
    const { manager } = getState()
    const element = el.querySelector('.input-container') as HTMLDivElement
    manager.element = el
    manager.isOpened.subscribe((isOpened) => {
      const suggestions = el.querySelector('.close-suggestions')
      const postControls = el.querySelector('.post-controls')
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
    })
    manager.isLoading.subscribe(async (isLoading) => {
      const loader = el.querySelector('.loader-container')
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
    manager.onSelectSuggestion.subscribe((value) => props.onSelectSuggestion(value))
    return () => manager.dispose()
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
            manager.selectSuggestion()
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
            background: 'rgba(128,128,128,0.1)',
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
          <SuggestInput manager={manager} />
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
        <SuggestionList manager={manager} />
      </div>
    )
  },
})
