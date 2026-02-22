import { cssVariableTheme } from '../../../services/css-variable-theme.js'

export const filterBaseCss = {
  display: 'block' as const,
  '& .filter-row': {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  '& .filter-actions': {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '4px',
  },
}

export const filterInputCss = {
  flex: '1',
  padding: '4px 6px',
  borderRadius: cssVariableTheme.shape.borderRadius.sm,
  border: `1px solid ${cssVariableTheme.divider}`,
  background: cssVariableTheme.background.default,
  color: cssVariableTheme.text.primary,
  fontSize: cssVariableTheme.typography.fontSize.xs,
}
