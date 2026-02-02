import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { LayoutService } from '../../services/layout-service.js'

/**
 * AppBar configuration for PageLayout.
 */
export type AppBarConfig = {
  /** AppBar visibility behavior */
  variant: 'permanent' | 'auto-hide'
  /** Height of the AppBar (CSS value). Default: '48px' */
  height?: string
  /** The AppBar component to render */
  component: JSX.Element
}

/**
 * Drawer configuration for a single side.
 */
export type DrawerConfig = {
  /** Drawer behavior variant */
  variant: 'permanent' | 'collapsible' | 'temporary'
  /** Width of the drawer (CSS value). Default: '240px' */
  width?: string
  /** The drawer content component */
  component: JSX.Element
  /** Initial open state for collapsible drawers. Default: true */
  defaultOpen?: boolean
}

/**
 * Props for the PageLayout component.
 */
export type PageLayoutProps = {
  /** AppBar configuration */
  appBar?: AppBarConfig
  /** Drawer configurations for left and/or right sides */
  drawer?: {
    left?: DrawerConfig
    right?: DrawerConfig
  }
  /** Gap between the AppBar and the content area (CSS value). Default: '0px' */
  topGap?: string
  /** Gap between the drawers and the content area (CSS value). Default: '0px' */
  sideGap?: string
}

const DEFAULT_APPBAR_HEIGHT = '48px'
const DEFAULT_DRAWER_WIDTH = '240px'

/**
 * PageLayout component for full-viewport application layouts.
 *
 * Provides a structured layout with:
 * - Optional AppBar (permanent or auto-hide)
 * - Optional left/right drawers (permanent, collapsible, or temporary)
 * - Main content area with automatic margin management
 * - Configurable gaps between AppBar/drawers and content
 *
 * @example
 * ```tsx
 * <PageLayout
 *   appBar={{
 *     variant: 'permanent',
 *     component: <MyAppBar />,
 *   }}
 *   drawer={{
 *     left: {
 *       variant: 'collapsible',
 *       component: <Sidebar />,
 *     },
 *   }}
 *   topGap="16px"
 *   sideGap="24px"
 * >
 *   <MainContent />
 * </PageLayout>
 * ```
 */
export const PageLayout = Shade<PageLayoutProps>({
  shadowDomName: 'shade-page-layout',
  css: {
    display: 'block',
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: cssVariableTheme.background.default,

    // AppBar container
    '& .page-layout-appbar': {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '1100',
      transition: 'top 0.3s ease-in-out',
    },

    // Auto-hide AppBar styles
    '& .page-layout-appbar.auto-hide': {
      top: 'calc(-1 * var(--layout-appbar-height, 48px))',
    },
    '& .page-layout-appbar.auto-hide:hover': {
      top: '0',
    },
    '& .page-layout-appbar.auto-hide.visible': {
      top: '0',
    },

    // Drawer containers
    '& .page-layout-drawer': {
      position: 'fixed',
      top: 'var(--layout-appbar-height, 48px)',
      bottom: '0',
      zIndex: '1000',
      overflow: 'hidden',
      transition: 'width 0.3s ease-in-out, transform 0.3s ease-in-out',
      background: cssVariableTheme.background.paper,
    },
    '& .page-layout-drawer-left': {
      left: '0',
      borderRight: `1px solid ${cssVariableTheme.divider}`,
    },
    '& .page-layout-drawer-right': {
      right: '0',
      borderLeft: `1px solid ${cssVariableTheme.divider}`,
    },
    '& .page-layout-drawer.closed': {
      width: '0 !important',
      overflow: 'hidden',
    },

    // Temporary drawer backdrop
    '& .page-layout-drawer-backdrop': {
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
    '& .page-layout-drawer-backdrop.visible': {
      opacity: '1',
      pointerEvents: 'auto',
    },

    // Content area - starts at top with padding for AppBar, AppBar overlays content
    '& .page-layout-content': {
      position: 'absolute',
      top: '0',
      left: 'var(--layout-content-margin-left, 0px)',
      right: 'var(--layout-content-margin-right, 0px)',
      bottom: '0',
      overflow: 'auto',
      transition: 'left 0.3s ease-in-out, right 0.3s ease-in-out',
    },
  },

  render: ({ props, children, injector, useObservable }) => {
    const layoutService = injector.getInstance(LayoutService)

    // Initialize AppBar height
    const appBarHeight = props.appBar?.height ?? DEFAULT_APPBAR_HEIGHT
    if (props.appBar) {
      layoutService.appBarHeight.setValue(appBarHeight)
    } else {
      layoutService.appBarHeight.setValue('0px')
    }

    // Initialize drawers
    const initializeDrawer = (position: 'left' | 'right', config: DrawerConfig) => {
      const width = config.width ?? DEFAULT_DRAWER_WIDTH
      const isOpen =
        config.variant === 'permanent' || (config.variant === 'collapsible' && (config.defaultOpen ?? true))
      const currentState = layoutService.drawerState.getValue()[position]

      // Only initialize if not already set (preserve user interactions)
      if (!currentState) {
        layoutService.initDrawer(position, { open: isOpen, width })
      } else if (currentState.width !== width) {
        // Update width if it changed
        layoutService.setDrawerWidth(position, width)
      }
    }

    if (props.drawer?.left) {
      initializeDrawer('left', props.drawer.left)
    }
    if (props.drawer?.right) {
      initializeDrawer('right', props.drawer.right)
    }

    // Subscribe to drawer state
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)

    // Subscribe to AppBar visibility (for auto-hide)
    const [appBarVisible] = useObservable('appBarVisible', layoutService.appBarVisible)

    // Handle temporary drawer backdrop click
    const handleBackdropClick = (position: 'left' | 'right') => {
      layoutService.setDrawerOpen(position, false)
    }

    // Check if any temporary drawer is open
    const isLeftTemporaryOpen = props.drawer?.left?.variant === 'temporary' && drawerState.left?.open
    const isRightTemporaryOpen = props.drawer?.right?.variant === 'temporary' && drawerState.right?.open
    const showBackdrop = isLeftTemporaryOpen || isRightTemporaryOpen

    // Calculate drawer widths for rendering
    const getDrawerStyle = (position: 'left' | 'right', config: DrawerConfig): Partial<CSSStyleDeclaration> => {
      const state = drawerState[position]
      const width = config.width ?? DEFAULT_DRAWER_WIDTH

      if (config.variant === 'temporary') {
        // Temporary drawers overlay content, use transform for animation
        return {
          width,
          transform: state?.open ? 'translateX(0)' : position === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
        }
      }

      // Permanent and collapsible drawers push content
      return {
        width: state?.open ? width : '0',
      }
    }

    // Build AppBar class list
    const appBarClasses = ['page-layout-appbar']
    if (props.appBar?.variant === 'auto-hide') {
      appBarClasses.push('auto-hide')
      if (appBarVisible) {
        appBarClasses.push('visible')
      }
    }

    return (
      <>
        {/* AppBar */}
        {props.appBar && (
          <div className={appBarClasses.join(' ')} style={{ height: appBarHeight }} data-testid="page-layout-appbar">
            {props.appBar.component}
          </div>
        )}

        {/* Backdrop for temporary drawers */}
        <div
          className={`page-layout-drawer-backdrop ${showBackdrop ? 'visible' : ''}`}
          onclick={() => {
            if (isLeftTemporaryOpen) handleBackdropClick('left')
            if (isRightTemporaryOpen) handleBackdropClick('right')
          }}
          data-testid="page-layout-backdrop"
        />

        {/* Left Drawer */}
        {props.drawer?.left && (
          <div
            className={`page-layout-drawer page-layout-drawer-left ${!drawerState.left?.open ? 'closed' : ''}`}
            style={getDrawerStyle('left', props.drawer.left)}
            data-testid="page-layout-drawer-left"
          >
            {props.drawer.left.component}
          </div>
        )}

        {/* Right Drawer */}
        {props.drawer?.right && (
          <div
            className={`page-layout-drawer page-layout-drawer-right ${!drawerState.right?.open ? 'closed' : ''}`}
            style={getDrawerStyle('right', props.drawer.right)}
            data-testid="page-layout-drawer-right"
          >
            {props.drawer.right.component}
          </div>
        )}

        {/* Main Content */}
        <main
          className="page-layout-content"
          style={{
            paddingTop: props.topGap
              ? `calc(${props.appBar ? appBarHeight : '0px'} + ${props.topGap})`
              : props.appBar
                ? appBarHeight
                : '0px',
            paddingLeft: props.sideGap ?? '0px',
            paddingRight: props.sideGap ?? '0px',
          }}
          data-testid="page-layout-content"
        >
          {children}
        </main>
      </>
    )
  },
})
