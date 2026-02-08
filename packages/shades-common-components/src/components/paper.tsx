import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const Paper = Shade<{ elevation?: 0 | 1 | 2 | 3 }>({
  tagName: 'shade-paper',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  css: {
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    padding: cssVariableTheme.spacing.md,
    backgroundColor: cssVariableTheme.background.paper,
    color: cssVariableTheme.text.primary,
    '&[data-elevation="0"]': {
      boxShadow: cssVariableTheme.shadows.none,
    },
    '&[data-elevation="1"]': {
      boxShadow: cssVariableTheme.shadows.sm,
    },
    '&[data-elevation="2"]': {
      boxShadow: cssVariableTheme.shadows.md,
    },
    '&[data-elevation="3"]': {
      boxShadow: cssVariableTheme.shadows.lg,
    },
  },
  render: ({ props, children, element }) => {
    const { elevation = 1 } = props
    element.setAttribute('data-elevation', elevation.toString())

    return <>{children}</>
  },
})
