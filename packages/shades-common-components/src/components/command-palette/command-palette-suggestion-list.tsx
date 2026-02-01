import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'
import type { CommandPaletteManager } from './command-palette-manager.js'

export const CommandPaletteSuggestionList = Shade<{ manager: CommandPaletteManager; fullScreenSuggestions?: boolean }>({
  shadowDomName: 'shade-command-palette-suggestion-list',
  css: {
    '& .suggestion-items-container': {
      borderTop: 'none',
      position: 'absolute',
      borderRadius: '0px 0px 12px 12px',
      marginLeft: '14px',
      marginTop: '4px',
      overflow: 'hidden',
      overflowY: 'auto',
      zIndex: '1',
      left: 'auto',
      backgroundColor: cssVariableTheme.background.paper,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(128,128,128,0.2)',
    },
    '& .suggestion-item': {
      padding: '0.875em 1.25em',
      cursor: 'pointer',
      background: 'transparent',
      fontWeight: '400',
      borderLeft: '3px solid transparent',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      fontSize: '0.95em',
      letterSpacing: '0.01em',
    },
    '& .suggestion-item:hover': {
      background: 'rgba(128,128,128,0.1)',
    },
    '& .suggestion-item.selected': {
      background: 'rgba(128,128,128,0.2)',
      fontWeight: '500',
      borderLeft: `3px solid ${cssVariableTheme.text.primary}`,
    },
    '& .suggestion-item.selected:hover': {
      background: 'rgba(128,128,128,0.2)',
    },
  },
  render: ({ element, injector, props, useObservable }) => {
    const { manager } = props

    const [suggestions] = useObservable('suggestions', props.manager.currentSuggestions)
    const [selectedIndex] = useObservable('selectedIndex', props.manager.selectedIndex, {
      onChange: (idx) => {
        ;([...element.querySelectorAll('.suggestion-item')] as HTMLDivElement[]).forEach((s, i) => {
          s.classList.toggle('selected', i === idx)
        })
      },
    })

    const [isOpenedAtRender] = useObservable('isOpenedAtRender', props.manager.isOpened, {
      onChange: (isOpened) => {
        const container = element.firstElementChild as HTMLDivElement
        if (isOpened) {
          container.style.display = 'initial'
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
          container.style.display = 'none'
        }
      },
    })

    return (
      <div
        className="suggestion-items-container"
        style={{
          opacity: manager.isOpened.getValue() ? '1' : '0',
          maxHeight: `${window.innerHeight * 0.8}px`,
          width: `calc(${Math.round(element.parentElement?.getBoundingClientRect().width || 200)}px - 3em)`,
          ...(props.fullScreenSuggestions ? { left: '0', width: 'calc(100% - 42px)' } : {}),
        }}
      >
        {suggestions.map((s, i) => (
          <div
            className={`suggestion-item${i === selectedIndex ? ' selected' : ''}`}
            onclick={() => {
              if (isOpenedAtRender) {
                manager.selectSuggestion(injector, i)
              }
            }}
          >
            {s.element}
          </div>
        ))}
      </div>
    )
  },
})
