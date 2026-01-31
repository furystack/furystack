import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const Paper = Shade<{ elevation?: 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  css: {
    borderRadius: '3px',
    margin: '8px',
    padding: '6px 16px',
    backgroundColor: cssVariableTheme.background.paper,
    color: cssVariableTheme.text.secondary,
    '&[data-elevation="1"]': {
      boxShadow: '1px 1px 1px rgba(0,0,0,0.3)',
    },
    '&[data-elevation="2"]': {
      boxShadow: '1px 2px 2px rgba(0,0,0,0.3)',
    },
    '&[data-elevation="3"]': {
      boxShadow: '1px 3px 3px rgba(0,0,0,0.3)',
    },
  },
  render: ({ props, children, element }) => {
    const { elevation = 1 } = props
    element.setAttribute('data-elevation', elevation.toString())

    return <>{children}</>
  },
})
