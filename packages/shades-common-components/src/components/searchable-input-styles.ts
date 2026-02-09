import type { CSSObject } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

/**
 * Shared CSS styles for searchable input components (CommandPalette, Suggest).
 * These components share the same input container, term icon, post controls,
 * and close button patterns.
 */
export const searchableInputStyles: CSSObject = {
  flexGrow: '1',

  '& .input-container': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 1.25em',
    borderRadius: cssVariableTheme.shape.borderRadius.lg,
    position: 'relative',
    background: cssVariableTheme.action.hoverBackground,
    border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    boxShadow: cssVariableTheme.shadows.sm,
    transition: `all ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}`,
  },

  '&[data-opened] .input-container': {
    background: cssVariableTheme.background.default,
    border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    boxShadow: cssVariableTheme.shadows.md,
  },

  '& .term-icon': {
    cursor: 'pointer',
    color: cssVariableTheme.text.secondary,
    fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    fontSize: '0.95em',
    transition: `color ${cssVariableTheme.transitions.duration.normal} ease`,
    padding: '0.5em 0.75em 0.5em 0',
    userSelect: 'none',
  },

  '& .term-icon:hover': {
    color: cssVariableTheme.text.primary,
  },

  '& .post-controls': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '0px',
    overflow: 'hidden',
  },

  '&[data-opened] .post-controls': {
    width: '50px',
  },

  '& .close-suggestions': {
    width: '24px',
    height: '24px',
    opacity: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: cssVariableTheme.shape.borderRadius.sm,
    transition: `all ${cssVariableTheme.transitions.duration.normal} ease`,
    fontSize: cssVariableTheme.typography.fontSize.md,
    color: cssVariableTheme.text.secondary,
    background: 'transparent',
    transform: 'scale(1)',
  },

  '&[data-opened] .close-suggestions': {
    opacity: '1',
  },

  '& .close-suggestions:hover': {
    background: cssVariableTheme.action.hoverBackground,
    transform: 'scale(1.1)',
  },
}
