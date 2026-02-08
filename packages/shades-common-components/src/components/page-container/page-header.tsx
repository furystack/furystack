import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { Paper } from '../paper.js'

/**
 * Props for the PageHeader component.
 */
export type PageHeaderProps = {
  /** Optional icon (emoji or single character) displayed before the title */
  icon?: string
  /** The page title */
  title: string
  /** Optional description text displayed below the title */
  description?: string
  /** Optional action elements (buttons, etc.) aligned to the right */
  actions?: JSX.Element
}

/**
 * PageHeader component for consistent page titles and descriptions.
 *
 * Provides a standardized header with:
 * - Optional icon before the title
 * - Main title with primary text styling
 * - Optional description with secondary text styling
 * - Optional action buttons aligned to the right
 *
 * @example
 * ```tsx
 * // Simple header with icon and description
 * <PageHeader
 *   icon="👥"
 *   title="Users"
 *   description="Manage user accounts and their roles."
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Header with action buttons
 * <PageHeader
 *   icon="📁"
 *   title="Projects"
 *   description="View and manage your projects."
 *   actions={
 *     <Button variant="contained">Create Project</Button>
 *   }
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Minimal header (title only)
 * <PageHeader title="Dashboard" />
 * ```
 */
export const PageHeader = Shade<PageHeaderProps>({
  tagName: 'shade-page-header',
  css: {
    display: 'block',
    position: 'sticky',
    top: '0',

    '& .page-header-container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: cssVariableTheme.spacing.md,
    },

    '& .page-header-content': {
      flex: '1',
      minWidth: '0',
    },

    '& .page-header-title': {
      margin: '0',
      fontSize: cssVariableTheme.typography.fontSize.xl,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      lineHeight: cssVariableTheme.typography.lineHeight.tight,
      color: cssVariableTheme.text.primary,
    },

    '& .page-header-icon': {
      marginRight: cssVariableTheme.spacing.sm,
    },

    '& .page-header-description': {
      margin: `${cssVariableTheme.spacing.sm} 0 0 0`,
      fontSize: cssVariableTheme.typography.fontSize.md,
      lineHeight: cssVariableTheme.typography.lineHeight.normal,
      color: cssVariableTheme.text.secondary,
    },

    '& .page-header-actions': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      flexShrink: '0',
    },
  },
  render: ({ props }) => {
    const { icon, title, description, actions } = props

    return (
      <Paper elevation={2} className="page-header-container">
        <div className="page-header-content">
          <h2 className="page-header-title" data-testid="page-header-title">
            {icon && <span className="page-header-icon">{icon}</span>}
            {title}
          </h2>
          {description && (
            <p className="page-header-description" data-testid="page-header-description">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="page-header-actions" data-testid="page-header-actions">
            {actions}
          </div>
        )}
      </Paper>
    )
  },
})
