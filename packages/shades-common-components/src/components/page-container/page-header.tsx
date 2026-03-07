import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { Paper } from '../paper.js'
import { Typography } from '../typography.js'

/**
 * Props for the PageHeader component.
 */
export type PageHeaderProps = {
  /** Optional icon displayed before the title (string or JSX element such as an Icon component) */
  icon?: JSX.Element | string
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
 * // Header with an Icon component
 * <PageHeader
 *   icon={<Icon icon={icons.users} />}
 *   title="Users"
 *   description="Manage user accounts and their roles."
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Header with action buttons
 * <PageHeader
 *   icon={<Icon icon={icons.folder} />}
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
  customElementName: 'shade-page-header',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
    position: 'sticky',
    top: '0',
    zIndex: `calc(${cssVariableTheme.zIndex.drawer} - 1)`,

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
    },

    '& .page-header-icon': {
      marginRight: cssVariableTheme.spacing.sm,
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
          <Typography
            variant="h4"
            className="page-header-title"
            data-testid="page-header-title"
            style={{
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: cssVariableTheme.spacing.sm,
              lineHeight: '100%',
            }}
          >
            {icon && <span className="page-header-icon">{icon}</span>}
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body1"
              color="textSecondary"
              className="page-header-description"
              data-testid="page-header-description"
              style={{ margin: '0', marginTop: cssVariableTheme.spacing.md }}
            >
              {description}
            </Typography>
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
