import { ScreenService, Shade, createComponent, type ScreenSize } from '@furystack/shades'
import type { ValueObserver } from '@furystack/utils'
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
  /** Auto-collapse the drawer below this breakpoint (uses ScreenService) */
  collapseOnBreakpoint?: ScreenSize
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
 * - Responsive drawer collapse via `collapseOnBreakpoint`
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
 *       collapseOnBreakpoint: 'md', // Auto-collapse below 900px
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
      pointerEvents: 'none',
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
      bottom: '0',
      overflow: 'auto',
    },
  },

  render: ({ props, children, injector, useObservable, useDisposable }) => {
    const layoutService = injector.getInstance(LayoutService)
    const screenService = injector.getInstance(ScreenService)

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

    // Set up responsive breakpoint listeners for drawers
    const setupBreakpointListener = (position: 'left' | 'right', config: DrawerConfig) => {
      const { collapseOnBreakpoint, variant } = config

      if (!collapseOnBreakpoint || variant === 'permanent') {
        return { [Symbol.dispose]: () => {} }
      }

      const breakpointObservable = screenService.screenSize.atLeast[collapseOnBreakpoint]

      const subscription: ValueObserver<boolean> = breakpointObservable.subscribe((isAtLeast) => {
        const currentState = layoutService.drawerState.getValue()[position]
        const currentlyOpen = currentState?.open ?? false

        // When screen becomes smaller than breakpoint, close the drawer
        // When screen becomes larger than breakpoint, open the drawer (for collapsible)
        if (variant === 'collapsible') {
          // Only update if the state needs to change
          if (isAtLeast !== currentlyOpen) {
            layoutService.setDrawerOpen(position, isAtLeast)
          }
        } else if (variant === 'temporary' && isAtLeast && currentlyOpen) {
          // For temporary drawers, close when screen is large enough
          layoutService.setDrawerOpen(position, false)
        }
      })

      return subscription
    }

    // Set up breakpoint listeners for left and right drawers
    useDisposable('breakpoint-listener-left', () => {
      if (props.drawer?.left?.collapseOnBreakpoint) {
        return setupBreakpointListener('left', props.drawer.left)
      }
      return { [Symbol.dispose]: () => {} }
    })

    useDisposable('breakpoint-listener-right', () => {
      if (props.drawer?.right?.collapseOnBreakpoint) {
        return setupBreakpointListener('right', props.drawer.right)
      }
      return { [Symbol.dispose]: () => {} }
    })

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

    // Get drawer width (animation is handled by CSS classes)
    const getDrawerWidth = (config: DrawerConfig): string => {
      return config.width ?? DEFAULT_DRAWER_WIDTH
    }

    // Calculate content margin based on drawer state
    const getContentMargin = (position: 'left' | 'right'): string => {
      const config = props.drawer?.[position]
      if (!config) return '0px'

      // Temporary drawers overlay content, don't push it
      if (config.variant === 'temporary') return '0px'

      const state = drawerState[position]
      const width = config.width ?? DEFAULT_DRAWER_WIDTH

      // Permanent drawers always push content
      if (config.variant === 'permanent') return width

      // Collapsible drawers push content only when open
      return state?.open ? width : '0px'
    }

    // Build AppBar class list
    const appBarClasses = ['page-layout-appbar']
    if (props.appBar?.variant === 'auto-hide') {
      appBarClasses.push('auto-hide')
      if (appBarVisible) {
        appBarClasses.push('visible')
      }
    }

    // Get drawer widths for animation keyframes
    const leftDrawerWidth = props.drawer?.left?.width ?? DEFAULT_DRAWER_WIDTH
    const rightDrawerWidth = props.drawer?.right?.width ?? DEFAULT_DRAWER_WIDTH
    const leftDrawerOpen = drawerState.left?.open ?? false
    const rightDrawerOpen = drawerState.right?.open ?? false
    const leftDrawerVariant = props.drawer?.left?.variant
    const rightDrawerVariant = props.drawer?.right?.variant

    // Calculate content margins for animation (temporary drawers don't affect content)
    const shouldAnimateLeft = leftDrawerVariant === 'collapsible'
    const shouldAnimateRight = rightDrawerVariant === 'collapsible'

    const targetLeftMargin = getContentMargin('left')
    const targetRightMargin = getContentMargin('right')
    // Previous margin is the opposite state (for animation from → to)
    const prevLeftMargin = shouldAnimateLeft ? (leftDrawerOpen ? '0px' : leftDrawerWidth) : targetLeftMargin
    const prevRightMargin = shouldAnimateRight ? (rightDrawerOpen ? '0px' : rightDrawerWidth) : targetRightMargin

    // Keyframe CSS for animations (Shades recreates elements on re-render, so transitions don't work)
    const keyframeStyles = `
      @keyframes slideInFromLeft {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      @keyframes slideOutToLeft {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }
      @keyframes slideInFromRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes slideOutToRight {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
      }
      @keyframes contentExpandLeft {
        from { left: ${prevLeftMargin}; }
        to { left: ${targetLeftMargin}; }
      }
      @keyframes contentExpandRight {
        from { right: ${prevRightMargin}; }
        to { right: ${targetRightMargin}; }
      }
      .page-layout-drawer-left.open {
        animation: slideInFromLeft 0.3s ease-in-out forwards;
      }
      .page-layout-drawer-left.closed {
        animation: slideOutToLeft 0.3s ease-in-out forwards;
      }
      .page-layout-drawer-right.open {
        animation: slideInFromRight 0.3s ease-in-out forwards;
      }
      .page-layout-drawer-right.closed {
        animation: slideOutToRight 0.3s ease-in-out forwards;
      }
      .page-layout-content {
        animation: contentExpandLeft 0.3s ease-in-out forwards, contentExpandRight 0.3s ease-in-out forwards;
      }
    `

    return (
      <>
        {/* Keyframe animations for drawer */}
        <style>{keyframeStyles}</style>

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
            className={`page-layout-drawer page-layout-drawer-left ${drawerState.left?.open ? 'open' : 'closed'}`}
            style={{ width: getDrawerWidth(props.drawer.left) }}
            data-testid="page-layout-drawer-left"
          >
            {props.drawer.left.component}
          </div>
        )}

        {/* Right Drawer */}
        {props.drawer?.right && (
          <div
            className={`page-layout-drawer page-layout-drawer-right ${drawerState.right?.open ? 'open' : 'closed'}`}
            style={{ width: getDrawerWidth(props.drawer.right) }}
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
            left: getContentMargin('left'),
            right: getContentMargin('right'),
          }}
          data-testid="page-layout-content"
        >
          {children}
        </main>
      </>
    )
  },
})
