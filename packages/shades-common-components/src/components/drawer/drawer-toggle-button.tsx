import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { LayoutService } from '../../services/layout-service.js'

/**
 * Props for the DrawerToggleButton component.
 */
export type DrawerToggleButtonProps = {
  /** Which drawer to toggle */
  position: 'left' | 'right'
  /** Button aria-label for accessibility. Default: 'Toggle drawer' */
  ariaLabel?: string
}

/**
 * Default toggle button for collapsible drawers.
 *
 * Provides a hamburger menu icon that toggles the drawer open/closed
 * via LayoutService. The icon animates between menu and close states.
 *
 * @example
 * ```tsx
 * // In AppBar
 * <AppBar>
 *   <DrawerToggleButton position="left" />
 *   <h1>My App</h1>
 * </AppBar>
 *
 * // With custom aria-label
 * <DrawerToggleButton
 *   position="left"
 *   ariaLabel="Toggle navigation menu"
 * />
 * ```
 */
export const DrawerToggleButton = Shade<DrawerToggleButtonProps>({
  tagName: 'shade-drawer-toggle-button',
  css: {
    display: 'inline-block',

    '& button': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      padding: '0',
      margin: '0',
      border: 'none',
      borderRadius: '50%',
      background: 'transparent',
      cursor: 'pointer',
      transition: `background-color ${cssVariableTheme.transitions.duration.normal} ease`,
      color: cssVariableTheme.text.primary,
    },

    '& button:hover': {
      backgroundColor: cssVariableTheme.button.hover,
    },

    '& button:focus-visible': {
      outline: `2px solid ${cssVariableTheme.palette.primary.main}`,
      outlineOffset: '2px',
    },

    // Hamburger icon container
    '& .hamburger': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '20px',
      height: '14px',
    },

    '& .hamburger span': {
      display: 'block',
      width: '100%',
      height: '2px',
      backgroundColor: 'currentColor',
      borderRadius: '1px',
      transition: `transform ${cssVariableTheme.transitions.duration.slow} ease, opacity ${cssVariableTheme.transitions.duration.slow} ease`,
    },

    // Open state - transform to X
    '& .hamburger.open span:nth-child(1)': {
      transform: 'translateY(6px) rotate(45deg)',
    },
    '& .hamburger.open span:nth-child(2)': {
      opacity: '0',
    },
    '& .hamburger.open span:nth-child(3)': {
      transform: 'translateY(-6px) rotate(-45deg)',
    },
  },

  render: ({ props, injector, useObservable }) => {
    const layoutService = injector.getInstance(LayoutService)
    const { position, ariaLabel = 'Toggle drawer' } = props

    // Subscribe to drawer state to update icon
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)
    const isOpen = drawerState[position]?.open ?? false

    const handleClick = () => {
      layoutService.toggleDrawer(position)
    }

    return (
      <button
        type="button"
        onclick={handleClick}
        aria-label={ariaLabel}
        aria-expanded={isOpen ? 'true' : 'false'}
        data-testid={`drawer-toggle-${position}`}
      >
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span />
          <span />
          <span />
        </div>
      </button>
    )
  },
})
