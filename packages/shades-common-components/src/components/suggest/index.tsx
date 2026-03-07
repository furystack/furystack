import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import { Icon } from '../icons/icon.js'
import { close } from '../icons/icon-definitions.js'
import { Loader } from '../loader.js'
import { searchableInputStyles } from '../searchable-input-styles.js'
import { SuggestInput } from './suggest-input.js'
import { SuggestManager } from './suggest-manager.js'
import { SuggestionList } from './suggestion-list.js'
import type { SuggestionResult } from './suggestion-result.js'

export * from './suggest-input.js'
export * from './suggest-manager.js'
export * from './suggestion-list.js'
export * from './suggestion-result.js'

type SuggestAsyncProps<T> = {
  defaultPrefix: JSX.Element | string
  getEntries: (term: string) => Promise<T[]>
  getSuggestionEntry: (entry: T) => SuggestionResult
  onSelectSuggestion: (entry: T) => void
  style?: Partial<CSSStyleDeclaration>
}

type SuggestSyncProps = {
  defaultPrefix: JSX.Element | string
  /** Static list of string suggestions. Filtered client-side by the search term. When the term is empty, all suggestions are shown. */
  suggestions: string[]
  onSelectSuggestion: (entry: string) => void
  style?: Partial<CSSStyleDeclaration>
}

export type SuggestProps<T> = SuggestAsyncProps<T> | SuggestSyncProps

const isSyncProps = (props: SuggestProps<unknown>): props is SuggestSyncProps => {
  return 'suggestions' in props
}

export const Suggest: <T>(props: SuggestProps<T>, children: ChildrenList) => JSX.Element<any> = Shade<
  SuggestProps<any>
>({
  customElementName: 'shade-suggest',
  css: {
    ...searchableInputStyles,
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& .suggest-wrapper': {
      display: 'flex',
      flexDirection: 'column',
    },
  },
  render: ({ props, injector, useDisposable, useRef, useHostProps, useObservable }) => {
    let getEntries: (term: string) => Promise<unknown[]>
    let getSuggestionEntry: (entry: unknown) => SuggestionResult

    if (isSyncProps(props)) {
      const { suggestions } = props
      getEntries = async (term: string) => {
        const lower = term.toLowerCase()
        return suggestions.filter((s) => s.toLowerCase().includes(lower))
      }
      getSuggestionEntry = (entry: unknown) => ({
        element: <>{entry as string}</>,
        score: 1,
      })
    } else {
      ;({ getEntries, getSuggestionEntry } = props)
    }

    const manager = useDisposable('manager', () => new SuggestManager(getEntries, getSuggestionEntry))
    const wrapperRef = useRef<HTMLDivElement>('wrapper')
    const loaderRef = useRef<HTMLSpanElement>('loader')

    // Keep manager.element in sync for click-outside detection
    queueMicrotask(() => {
      const hostEl = wrapperRef.current?.closest('shade-suggest') as HTMLElement | null
      if (hostEl) manager.element = hostEl
    })

    const [isOpened] = useObservable('isOpened', manager.isOpened)

    useHostProps({
      'data-opened': isOpened ? '' : undefined,
    })
    useDisposable('isLoadingSubscription', () =>
      manager.isLoading.subscribe((isLoading) => {
        const loader = loaderRef.current
        if (!loader) return
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
      }),
    )
    useDisposable('onSelectSuggestion', () =>
      manager.subscribe('onSelectSuggestion', props.onSelectSuggestion as (entry: unknown) => void),
    )
    return (
      <div
        ref={wrapperRef}
        className="suggest-wrapper"
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
        <div className="input-container" style={props.style}>
          <div className="term-icon" onclick={() => manager.isOpened.setValue(true)}>
            {props.defaultPrefix}
          </div>
          <SuggestInput manager={manager} />
          <div className="post-controls">
            <span ref={loaderRef} style={{ display: 'inline-flex' }}>
              <Loader
                // eslint-disable-next-line furystack/no-direct-get-value-in-render -- Initial opacity only; animated transitions handled by isLoadingSubscription via DOM
                style={{ width: '20px', height: '20px', opacity: manager.isLoading.getValue() ? '1' : '0' }}
                delay={0}
                borderWidth={4}
              />
            </span>
            <div className="close-suggestions" onclick={() => manager.isOpened.setValue(false)}>
              <Icon icon={close} size={14} />
            </div>
          </div>
        </div>
        <SuggestionList manager={manager} />
      </div>
    )
  },
})
