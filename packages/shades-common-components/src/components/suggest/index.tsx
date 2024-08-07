import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import { Loader } from '../loader.js'
import { SuggestInput } from './suggest-input.js'
import { SuggestManager } from './suggest-manager.js'
import { SuggestionList } from './suggestion-list.js'
import type { SuggestionResult } from './suggestion-result.js'

export * from './suggest-input.js'
export * from './suggest-manager.js'
export * from './suggestion-list.js'
export * from './suggestion-result.js'

export interface SuggestProps<T> {
  defaultPrefix: string
  getEntries: (term: string) => Promise<T[]>
  getSuggestionEntry: (entry: T) => SuggestionResult
  onSelectSuggestion: (entry: T) => void
  style?: Partial<CSSStyleDeclaration>
}

export const Suggest: <T>(props: SuggestProps<T>, children: ChildrenList) => JSX.Element<any> = Shade<
  SuggestProps<any>
>({
  shadowDomName: 'shade-suggest',
  style: {
    flexGrow: '1',
  },
  render: ({ props, injector, element, useDisposable }) => {
    const manager = useDisposable('manager', () => new SuggestManager(props.getEntries, props.getSuggestionEntry))
    const { theme } = injector.getInstance(ThemeProviderService)
    manager.element = element
    manager.isOpened.subscribe((isOpened) => {
      const inputContainer = element.querySelector('.input-container') as HTMLDivElement

      const suggestions = element.querySelector('.close-suggestions')
      const postControls = element.querySelector('.post-controls')
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
    })
    manager.isLoading.subscribe((isLoading) => {
      const loader = element.querySelector('shade-loader')
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
    })
    useDisposable('onSelectSuggestion', () => manager.subscribe('onSelectSuggestion', props.onSelectSuggestion))
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

          void manager.getSuggestion({ injector, term: (ev.target as HTMLInputElement).value })
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
            <Loader
              style={{ width: '20px', height: '20px', opacity: manager.isLoading.getValue() ? '1' : '0' }}
              delay={0}
              borderWidth={4}
            />
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
