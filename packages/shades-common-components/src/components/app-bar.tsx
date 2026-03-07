import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const AppBar = Shade({
  customElementName: 'shade-app-bar',
  css: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    boxShadow: cssVariableTheme.shadows.md,
    transition: `opacity ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}, padding ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}`,
    opacity: '0',
    position: 'fixed',
    zIndex: '1',
    fontFamily: cssVariableTheme.typography.fontFamily,
    color: cssVariableTheme.text.primary,
    // backdrop-filter on the host would create a containing block for position:fixed
    // descendants (per CSS spec), breaking Dropdown overlays inside the AppBar.
    // Using a pseudo-element avoids this while preserving the visual effect.
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '0',
      zIndex: '-1',
      background: `color-mix(in srgb, ${cssVariableTheme.background.paper} 85%, transparent)`,
      backgroundImage: cssVariableTheme.background.paperImage,
      backdropFilter: `blur(${cssVariableTheme.effects.blurLg})`,
    },
    '&[data-visible]': {
      opacity: '1',
    },
  },
  render: ({ children, useHostProps, useDisposable, useState }) => {
    const [isVisible, setVisible] = useState('isVisible', false)

    useDisposable('enter-animation', () => {
      requestAnimationFrame(() => {
        setVisible(true)
      })
      return { [Symbol.dispose]: () => {} }
    })

    if (isVisible) {
      useHostProps({ 'data-visible': '' })
    }

    return <>{children}</>
  },
})
