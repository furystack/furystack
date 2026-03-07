import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const Paper = Shade<{ elevation?: 0 | 1 | 2 | 3 }>({
  customElementName: 'shade-paper',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    padding: cssVariableTheme.spacing.md,
    background: cssVariableTheme.background.paper,
    backgroundImage: cssVariableTheme.background.paperImage,
    color: cssVariableTheme.text.primary,
    borderStyle: 'solid',
    borderWidth: cssVariableTheme.shape.borderWidth,
    borderColor: `${cssVariableTheme.action.subtleBorder} ${cssVariableTheme.divider} ${cssVariableTheme.divider} ${cssVariableTheme.action.subtleBorder}`,
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
  render: ({ props, children, useHostProps }) => {
    const { elevation = 1 } = props
    useHostProps({ 'data-elevation': elevation.toString() })

    return <>{children}</>
  },
})
