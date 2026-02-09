import { Shade, createComponent } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import { Icon } from '../icons/icon.js'
import { close } from '../icons/icon-definitions.js'
import { Loader } from '../loader.js'
import { searchableInputStyles } from '../searchable-input-styles.js'
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
  css: {
    ...searchableInputStyles,
    '& .command-palette-wrapper': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .loader-container': {
      width: '20px',
      height: '20px',
      opacity: '0',
    },
    '&[data-loading] .loader-container': {
      opacity: '1',
    },
  },
  render: ({ props, injector, useState, useDisposable, useObservable, useHostProps, useRef }) => {
    const [manager] = useState('manager', new CommandPaletteManager(props.commandProviders))
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useDisposable('clickAwayService', () => {
      // Defer to next microtask so the ref is populated after mount
      let clickAway: ClickAwayService | null = null
      queueMicrotask(() => {
        const hostEl = wrapperRef.current?.closest('shade-command-palette') as HTMLElement | null
        if (hostEl) {
          clickAway = new ClickAwayService(hostEl, () => manager.isOpened.setValue(false))
        }
      })
      return { [Symbol.dispose]: () => clickAway?.[Symbol.dispose]() }
    })

    const [isLoading] = useObservable('isLoading', manager.isLoading)
    const [isOpenedAtRender, setIsOpened] = useObservable('isOpened', manager.isOpened)

    useHostProps({
      ...(isLoading ? { 'data-loading': '' } : {}),
      ...(isOpenedAtRender ? { 'data-opened': '' } : {}),
    })

    return (
      <div
        ref={wrapperRef}
        className="command-palette-wrapper"
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
        <div className="input-container" style={props.style}>
          <div className="term-icon" onclick={() => setIsOpened(true)}>
            {props.defaultPrefix}
          </div>
          <CommandPaletteInput manager={manager} />
          <div className="post-controls">
            <div className="loader-container">
              <Loader style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="close-suggestions" onclick={() => setIsOpened(false)}>
              <Icon icon={close} size={14} />
            </div>
          </div>
        </div>
        <CommandPaletteSuggestionList manager={manager} fullScreenSuggestions={props.fullScreenSuggestions} />
      </div>
    )
  },
})
