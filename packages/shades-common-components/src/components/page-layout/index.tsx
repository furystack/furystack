import { ScreenService, Shade, createComponent, type ScreenSize } from '@furystack/shades'
import type { ValueObserver } from '@furystack/utils'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { LAYOUT_CSS_VARIABLES, LayoutService } from '../../services/layout-service.js'

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
 * The LayoutService is scoped to this component, so CSS variables are isolated
 * and automatically cleaned up when navigating away.
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

    '& div[is="shade-paper"]': {
      margin: '0',
    },

    // AppBar container
    '& .page-layout-appbar': {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: cssVariableTheme.zIndex.appBar,
      transition: `top ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.easeInOut}`,
      height: `var(${LAYOUT_CSS_VARIABLES.appBarHeight})`,
    },

    // Auto-hide AppBar styles (controlled via host data attributes)
    '&[data-appbar-auto-hide] .page-layout-appbar': {
      top: 'calc(-1 * var(--layout-appbar-height, 48px))',
    },
    '&[data-appbar-auto-hide] .page-layout-appbar:hover': {
      top: '0',
    },
    '&[data-appbar-auto-hide][data-appbar-visible] .page-layout-appbar': {
      top: '0',
    },

    // Drawer containers - use CSS transitions
    '& .page-layout-drawer': {
      position: 'fixed',
      top: 'var(--layout-appbar-height, 48px)',
      bottom: '0',
      zIndex: cssVariableTheme.zIndex.drawer,
      overflow: 'hidden',
      background: cssVariableTheme.background.paper,
      transition: `transform ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.easeInOut}`,
    },
    '& .page-layout-drawer-left': {
      left: '0',
      width: 'var(--layout-drawer-left-configured-width, 240px)',
      borderRight: `1px solid ${cssVariableTheme.divider}`,
      transform: 'translateX(0)',
    },
    '& .page-layout-drawer-right': {
      right: '0',
      width: 'var(--layout-drawer-right-configured-width, 240px)',
      borderLeft: `1px solid ${cssVariableTheme.divider}`,
      transform: 'translateX(0)',
    },

    // Drawer closed states (controlled via host data attributes)
    '&[data-drawer-left-closed] .page-layout-drawer-left': {
      transform: 'translateX(-100%)',
      pointerEvents: 'none',
    },
    '&[data-drawer-right-closed] .page-layout-drawer-right': {
      transform: 'translateX(100%)',
      pointerEvents: 'none',
    },

    // Temporary drawer backdrop
    '& .page-layout-drawer-backdrop': {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: cssVariableTheme.action.backdrop,
      zIndex: cssVariableTheme.zIndex.drawer,
      opacity: '0',
      pointerEvents: 'none',
      transition: `opacity ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.easeInOut}`,
    },
    '&[data-backdrop-visible] .page-layout-drawer-backdrop': {
      opacity: '1',
      pointerEvents: 'auto',
    },

    // Content area - uses CSS variables for positioning
    '& .page-layout-content': {
      position: 'absolute',
      top: '0',
      bottom: '0',
      overflow: 'auto',
      paddingTop: 'var(--layout-content-padding-top, 0px)',
      paddingLeft: 'var(--layout-side-gap, 0px)',
      paddingRight: 'var(--layout-side-gap, 0px)',
      left: 'var(--layout-content-margin-left, 0px)',
      right: 'var(--layout-content-margin-right, 0px)',
      transition: `left ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.easeInOut}, right ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.easeInOut}`,
    },
  },

  render: ({ props, children, injector, useObservable, useDisposable, useHostProps }) => {
    // Create scoped LayoutService (CSS variables are set on the host via useHostProps)
    const layoutService = useDisposable('layoutService', () => new LayoutService())

    // Create a child injector with the scoped LayoutService
    // This allows child components (like DrawerToggleButton) to access it
    const childInjector = useDisposable('childInjector', () => {
      const child = injector.createChild()
      child.setExplicitInstance(layoutService, LayoutService)
      return child
    })

    // Propagate the child injector on the host so descendants can find it
    useHostProps({ injector: childInjector })

    const screenService = injector.getInstance(ScreenService)

    // Initialize AppBar
    const appBarHeight = props.appBar?.height ?? DEFAULT_APPBAR_HEIGHT
    if (props.appBar) {
      layoutService.appBarHeight.setValue(appBarHeight)

      // Only reset appBarVisible when transitioning to auto-hide (not on every render)
      const prevVariant = layoutService.appBarVariant.getValue()
      layoutService.appBarVariant.setValue(props.appBar.variant)
      if (props.appBar.variant === 'auto-hide' && prevVariant !== 'auto-hide') {
        layoutService.appBarVisible.setValue(false)
      }
    } else {
      layoutService.appBarHeight.setValue('0px')
    }

    // Initialize gaps
    layoutService.setTopGap(props.topGap ?? '0px')
    layoutService.setSideGap(props.sideGap ?? '0px')

    // Initialize drawers
    const initializeDrawer = (position: 'left' | 'right', config: DrawerConfig) => {
      const width = config.width ?? DEFAULT_DRAWER_WIDTH
      // Permanent drawers are always open
      // Collapsible drawers default to open unless defaultOpen is false
      // Temporary drawers default to closed unless defaultOpen is true
      const isOpen =
        config.variant === 'permanent' ||
        (config.variant === 'collapsible' && (config.defaultOpen ?? true)) ||
        (config.variant === 'temporary' && config.defaultOpen === true)
      const currentState = layoutService.drawerState.getValue()[position]

      // Only initialize if not already set (preserve user interactions)
      if (!currentState) {
        layoutService.initDrawer(position, { open: isOpen, width, variant: config.variant })
      } else if (currentState.width !== width || currentState.variant !== config.variant) {
        // Update if width or variant changed
        layoutService.initDrawer(position, { ...currentState, width, variant: config.variant })
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

      const applyBreakpoint = (isAtLeast: boolean) => {
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
      }

      const subscription: ValueObserver<boolean> = breakpointObservable.subscribe(applyBreakpoint)

      // Apply the current breakpoint value immediately since subscribe only fires on changes
      applyBreakpoint(breakpointObservable.getValue())

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

    // Subscribe to drawer state and appbar visibility - re-render to update host props
    const [drawerState] = useObservable('drawerState', layoutService.drawerState)
    const [isAppBarVisible] = useObservable('appBarVisible', layoutService.appBarVisible)

    // Set host classes via useHostProps for CSS-based animations
    const isLeftOpen = drawerState.left?.open ?? false
    const isRightOpen = drawerState.right?.open ?? false
    const isLeftTemporaryOpen = props.drawer?.left?.variant === 'temporary' && isLeftOpen
    const isRightTemporaryOpen = props.drawer?.right?.variant === 'temporary' && isRightOpen

    // Compute CSS variables from LayoutService state
    const appBarHeightVal = layoutService.appBarHeight.getValue()
    const appBarVariantVal = layoutService.appBarVariant.getValue()
    const topGapVal = layoutService.topGap.getValue()
    const sideGapVal = layoutService.sideGap.getValue()
    const contentPaddingTop = appBarVariantVal === 'auto-hide' ? topGapVal : `calc(${appBarHeightVal} + ${topGapVal})`
    const leftWidth = drawerState.left?.open ? (drawerState.left.width ?? '0px') : '0px'
    const rightWidth = drawerState.right?.open ? (drawerState.right.width ?? '0px') : '0px'
    const leftContentMargin = layoutService.getContentMarginForPosition('left')
    const rightContentMargin = layoutService.getContentMarginForPosition('right')

    useHostProps({
      ...(!isLeftOpen ? { 'data-drawer-left-closed': '' } : {}),
      ...(!isRightOpen ? { 'data-drawer-right-closed': '' } : {}),
      ...(props.appBar?.variant === 'auto-hide' ? { 'data-appbar-auto-hide': '' } : {}),
      ...(props.appBar?.variant === 'auto-hide' && isAppBarVisible ? { 'data-appbar-visible': '' } : {}),
      ...(isLeftTemporaryOpen || isRightTemporaryOpen ? { 'data-backdrop-visible': '' } : {}),
      style: {
        '--layout-appbar-height': appBarHeightVal,
        '--layout-top-gap': topGapVal,
        '--layout-side-gap': sideGapVal,
        '--layout-content-padding-top': contentPaddingTop,
        '--layout-content-margin-top': appBarHeightVal,
        '--layout-drawer-left-configured-width': drawerState.left?.width ?? '0px',
        '--layout-drawer-left-width': leftWidth,
        '--layout-content-margin-left': leftContentMargin,
        '--layout-drawer-right-configured-width': drawerState.right?.width ?? '0px',
        '--layout-drawer-right-width': rightWidth,
        '--layout-content-margin-right': rightContentMargin,
      },
    })

    // Handle temporary drawer backdrop click
    const handleBackdropClick = () => {
      const state = layoutService.drawerState.getValue()
      if (props.drawer?.left?.variant === 'temporary' && state.left?.open) {
        layoutService.setDrawerOpen('left', false)
      }
      if (props.drawer?.right?.variant === 'temporary' && state.right?.open) {
        layoutService.setDrawerOpen('right', false)
      }
    }

    return (
      <div style={{ display: 'contents' }}>
        {/* AppBar */}
        {props.appBar && (
          <div className="page-layout-appbar" data-testid="page-layout-appbar">
            {props.appBar.component}
          </div>
        )}

        {/* Backdrop for temporary drawers */}
        <div className="page-layout-drawer-backdrop" onclick={handleBackdropClick} data-testid="page-layout-backdrop" />

        {/* Left Drawer */}
        {props.drawer?.left && (
          <div className="page-layout-drawer page-layout-drawer-left" data-testid="page-layout-drawer-left">
            {props.drawer.left.component}
          </div>
        )}

        {/* Right Drawer */}
        {props.drawer?.right && (
          <div className="page-layout-drawer page-layout-drawer-right" data-testid="page-layout-drawer-right">
            {props.drawer.right.component}
          </div>
        )}

        {/* Main Content */}
        <main className="page-layout-content" data-testid="page-layout-content">
          {children}
        </main>
      </div>
    )
  },
})
