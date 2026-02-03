import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const AppBar = Shade({
  shadowDomName: 'shade-app-bar',
  css: {
    width: '100%',
    background: `color-mix(in srgb, ${cssVariableTheme.background.paper} 85%, transparent)`,
    backdropFilter: 'blur(15px)',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
    transition:
      'opacity .35s cubic-bezier(0.550, 0.085, 0.680, 0.530), padding .2s cubic-bezier(0.550, 0.085, 0.680, 0.530)',
    opacity: '0',
    position: 'fixed',
    zIndex: '1',
    color: cssVariableTheme.text.primary,
    '&.visible': {
      opacity: '1',
    },
  },
  constructed: ({ element }) => {
    requestAnimationFrame(() => {
      element.classList.add('visible')
    })
  },
  render: ({ children }) => {
    return <>{children}</>
  },
})
