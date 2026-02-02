import { ScreenService, Shade, createComponent, type ScreenSize } from '@furystack/shades'
import type { ValueObserver } from '@furystack/utils'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { LayoutService } from '../../services/layout-service.js'

export { DrawerToggleButton, type DrawerToggleButtonProps } from './drawer-toggle-button.js'

/**
 * Props for the Drawer component.
 */
export type DrawerProps = {
  /** Position of the drawer */
  position: 'left' | 'right'
  /** Drawer behavior variant */
  variant: 'permanent' | 'collapsible' | 'temporary'
  /** Width of the drawer (CSS value). Default: '240px' */
  width?: string
  /** Initial open state for collapsible/temporary drawers. Default: true for collapsible, false for temporary */
  defaultOpen?: boolean
  /** Auto-collapse the drawer below this breakpoint (uses ScreenService) */
  collapseOnBreakpoint?: ScreenSize
}

const DEFAULT_DRAWER_WIDTH = '240px'

/**
 * Standalone Drawer component for sidebars and navigation panels.
 *
 * Works with LayoutService for state management and supports three variants:
 * - **permanent**: Always visible, cannot be closed
 * - **collapsible**: Can be toggled open/closed, pushes content
 * - **temporary**: Overlays content with backdrop, closes on backdrop click
 *
 * Supports responsive behavior via `collapseOnBreakpoint` prop which
 * auto-collapses the drawer below a specified screen size.
 *
 * @example
 * ```tsx
 * // Simple collapsible drawer
 * <Drawer position="left" variant="collapsible">
 *   <nav>Navigation items...</nav>
 * </Drawer>
 *
 * // Responsive drawer that collapses on mobile
 * <Drawer
 *   position="left"
 *   variant="collapsible"
 *   collapseOnBreakpoint="md"
 * >
 *   <nav>Navigation items...</nav>
 * </Drawer>
 *
 * // Temporary drawer (mobile navigation)
 * <Drawer position="left" variant="temporary">
 *   <nav>Mobile navigation...</nav>
 * </Drawer>
 * ```
 */
export const Drawer = Shade<DrawerProps>({
  shadowDomName: 'shade-drawer',
  css: {
    display: 'block',

    // Drawer container
    '& .drawer-container': {
      position: 'fixed',
      top: 'var(--layout-content-margin-top, 0px)',
      bottom: '0',
      zIndex: '1000',
      overflow: 'hidden',
      transition: 'width 0.3s ease-in-out, transform 0.3s ease-in-out',
      background: cssVariableTheme.background.paper,
    },

    // Left drawer positioning
    '& .drawer-container.drawer-left': {
      left: '0',
      borderRight: `1px solid ${cssVariableTheme.divider}`,
    },

    // Right drawer positioning
    '& .drawer-container.drawer-right': {
      right: '0',
      borderLeft: `1px solid ${cssVariableTheme.divider}`,
    },

    // Closed state for permanent/collapsible
    '& .drawer-container.closed': {
      width: '0 !important',
      overflow: 'hidden',
    },

    // Content wrapper for proper overflow
    '& .drawer-content': {
      height: '100%',
      overflow: 'auto',
    },

    // Backdrop for temporary drawer
    '& .drawer-backdrop': {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: '999',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 0.3s ease-in-out',
    },
    '& .drawer-backdrop.visible': {
      opacity: '1',
      pointerEvents: 'auto',
    },
  },

  render: ({ props, children, injector, useObservable, useDisposable }) => {
    const layoutService = injector.getInstance(LayoutService)
    const screenService = injector.getInstance(ScreenService)

    const { position, variant, width = DEFAULT_DRAWER_WIDTH, defaultOpen, collapseOnBreakpoint } = props

    // Determine initial open state based on variant
    const getInitialOpenState = (): boolean => {
      if (variant === 'permanent') return true
      if (variant === 'temporary') return defaultOpen ?? false
      // collapsible defaults to true
      return defaultOpen ?? true
    }

    // Initialize drawer state if not already set
    const currentState = layoutService.drawerState.getValue()[position]
    if (!currentState) {
      layoutService.initDrawer(position, {
        open: getInitialOpenState(),
        width,
      })
    } else if (currentState.width !== width) {
      // Update width if it changed
      layoutService.setDrawerWidth(position, width)
    }

    // Subscribe to drawer state
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)
    const isOpen = drawerState[position]?.open ?? false

    // Set up responsive breakpoint listener
    useDisposable(`breakpoint-listener-${collapseOnBreakpoint}`, () => {
      if (!collapseOnBreakpoint || variant === 'permanent') {
        return { [Symbol.dispose]: () => {} }
      }

      const breakpointObservable = screenService.screenSize.atLeast[collapseOnBreakpoint]

      const subscription: ValueObserver<boolean> = breakpointObservable.subscribe((isAtLeast) => {
        // When screen becomes smaller than breakpoint, close the drawer
        // When screen becomes larger than breakpoint, open the drawer (for collapsible)
        if (variant === 'collapsible') {
          layoutService.setDrawerOpen(position, isAtLeast)
        } else if (variant === 'temporary' && isAtLeast) {
          // For temporary drawers, close when screen is large enough
          layoutService.setDrawerOpen(position, false)
        }
      })

      return subscription
    })

    // Handle backdrop click for temporary drawer
    const handleBackdropClick = () => {
      if (variant === 'temporary') {
        layoutService.setDrawerOpen(position, false)
      }
    }

    // Calculate drawer style
    const getDrawerStyle = (): Partial<CSSStyleDeclaration> => {
      if (variant === 'temporary') {
        // Temporary drawers use transform for slide animation
        return {
          width,
          transform: isOpen ? 'translateX(0)' : position === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
        }
      }

      // Permanent and collapsible drawers animate width
      return {
        width: isOpen ? width : '0',
      }
    }

    // Build container class list
    const containerClasses = ['drawer-container', `drawer-${position}`]
    if (!isOpen && variant !== 'temporary') {
      containerClasses.push('closed')
    }

    // Show backdrop only for open temporary drawers
    const showBackdrop = variant === 'temporary' && isOpen

    return (
      <>
        {/* Backdrop for temporary drawer */}
        {variant === 'temporary' && (
          <div
            className={`drawer-backdrop ${showBackdrop ? 'visible' : ''}`}
            onclick={handleBackdropClick}
            data-testid={`drawer-backdrop-${position}`}
          />
        )}

        {/* Drawer container */}
        <div
          className={containerClasses.join(' ')}
          style={getDrawerStyle()}
          data-testid={`drawer-${position}`}
          data-variant={variant}
          data-open={isOpen ? 'true' : 'false'}
        >
          <div className="drawer-content">{children}</div>
        </div>
      </>
    )
  },
})
