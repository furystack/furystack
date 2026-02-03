import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const Paper = Shade<{ elevation?: 0 | 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  css: {
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: cssVariableTheme.background.paper,
    color: cssVariableTheme.text.primary,
    '&[data-elevation="0"]': {
      boxShadow: 'none',
    },
    '&[data-elevation="1"]': {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    },
    '&[data-elevation="2"]': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08)',
    },
    '&[data-elevation="3"]': {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
    },
  },
  render: ({ props, children, element }) => {
    const { elevation = 1 } = props
    element.setAttribute('data-elevation', elevation.toString())

    return <>{children}</>
  },
})
