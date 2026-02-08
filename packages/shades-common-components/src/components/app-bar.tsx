import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const AppBar = Shade({
  shadowDomName: 'shade-app-bar',
  css: {
    width: '100%',
    background: `color-mix(in srgb, ${cssVariableTheme.background.paper} 85%, transparent)`,
    backdropFilter: `blur(${cssVariableTheme.effects.blurLg})`,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    boxShadow: cssVariableTheme.shadows.md,
    transition: `opacity ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}, padding ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}`,
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
