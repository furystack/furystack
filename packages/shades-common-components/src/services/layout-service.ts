import { Injectable } from '@furystack/inject'
import { ObservableValue, type ValueObserver } from '@furystack/utils'

/**
 * Drawer variant that determines how the drawer affects content layout.
 * - 'permanent': Always visible and pushes content
 * - 'collapsible': Pushes content when open, collapses when closed
 * - 'temporary': Overlays content without pushing (like a modal drawer)
 */
export type DrawerVariant = 'permanent' | 'collapsible' | 'temporary'

/**
 * Drawer configuration for a single side (left or right).
 */
export type DrawerSideState = {
  /** Whether the drawer is currently open */
  open: boolean
  /** Width of the drawer (CSS value, e.g., '240px') */
  width: string
  /** Variant that determines how the drawer affects content layout */
  variant: DrawerVariant
}

/**
 * State for all drawers in the layout.
 */
export type DrawerState = {
  /** Left drawer configuration */
  left?: DrawerSideState
  /** Right drawer configuration */
  right?: DrawerSideState
}

/**
 * CSS variable names managed by LayoutService.
 * These variables are set on document.documentElement for global access.
 *
 * Use these to access layout dimensions in your components:
 * ```typescript
 * // In Shade css property
 * css: {
 *   height: `var(${LAYOUT_CSS_VARIABLES.contentAvailableHeight})`,
 *   marginLeft: `var(${LAYOUT_CSS_VARIABLES.contentMarginLeft})`,
 * }
 *
 * // In inline styles
 * style={{ height: `var(${LAYOUT_CSS_VARIABLES.contentAvailableHeight})` }}
 * ```
 */
export const LAYOUT_CSS_VARIABLES = {
  /** Height of the AppBar (e.g., '48px') */
  appBarHeight: '--layout-appbar-height',
  /** Top gap spacing between AppBar and content */
  topGap: '--layout-top-gap',
  /** Side gap spacing for content padding */
  sideGap: '--layout-side-gap',
  /** Total padding from top (appBarHeight + topGap) */
  contentPaddingTop: '--layout-content-padding-top',
  /** Available height for content (100% - contentPaddingTop) */
  contentAvailableHeight: '--layout-content-available-height',
  /** Current width of the left drawer (0 when closed for collapsible/temporary) */
  drawerLeftWidth: '--layout-drawer-left-width',
  /** Current width of the right drawer (0 when closed for collapsible/temporary) */
  drawerRightWidth: '--layout-drawer-right-width',
  /** Configured width of the left drawer (always set, even when closed) */
  drawerLeftConfiguredWidth: '--layout-drawer-left-configured-width',
  /** Configured width of the right drawer (always set, even when closed) */
  drawerRightConfiguredWidth: '--layout-drawer-right-configured-width',
  /** Top margin for content (deprecated, use contentPaddingTop instead) */
  contentMarginTop: '--layout-content-margin-top',
  /** Left margin for content (considers drawer variant) */
  contentMarginLeft: '--layout-content-margin-left',
  /** Right margin for content (considers drawer variant) */
  contentMarginRight: '--layout-content-margin-right',
} as const

/**
 * Central service for managing layout state across the application.
 *
 * Manages:
 * - Drawer open/close state and widths
 * - AppBar visibility (for auto-hide mode)
 * - CSS custom properties for layout dimensions
 *
 * **Note:** For responsive breakpoint detection, use `ScreenService` from `@furystack/shades`.
 * ScreenService provides `screenSize.atLeast[size]` observables for responsive behavior.
 *
 * @example
 * ```typescript
 * // Get layout service for drawer management
 * const layoutService = injector.getInstance(LayoutService);
 *
 * // Toggle left drawer
 * layoutService.toggleDrawer('left');
 *
 * // For responsive behavior, use ScreenService
 * const screenService = injector.getInstance(ScreenService);
 * screenService.screenSize.atLeast.md.subscribe((isAtLeastMd) => {
 *   if (!isAtLeastMd) {
 *     layoutService.setDrawerOpen('left', false);
 *   }
 * });
 * ```
 */
@Injectable({ lifetime: 'singleton' })
export class LayoutService implements Disposable {
  /**
   * Observable state for all drawers.
   * Subscribe to receive updates when any drawer opens, closes, or changes width.
   */
  public drawerState = new ObservableValue<DrawerState>({})

  /**
   * AppBar visibility state.
   * Used for auto-hide AppBar mode - set to false to hide the AppBar.
   */
  public appBarVisible = new ObservableValue<boolean>(true)

  /**
   * Current AppBar height.
   * Used for calculating content margins.
   */
  public appBarHeight = new ObservableValue<string>('48px')

  /**
   * Top gap spacing between AppBar and content.
   * CSS value (e.g., '0px', '16px').
   */
  public topGap = new ObservableValue<string>('0px')

  /**
   * Side gap spacing for content padding.
   * CSS value (e.g., '0px', '16px').
   */
  public sideGap = new ObservableValue<string>('0px')

  private drawerStateSubscription: ValueObserver<DrawerState> | null = null
  private appBarHeightSubscription: ValueObserver<string> | null = null
  private topGapSubscription: ValueObserver<string> | null = null
  private sideGapSubscription: ValueObserver<string> | null = null

  constructor() {
    this.setupCssVariableSync()
    this.updateCssVariables()
  }

  /**
   * Toggles the open/close state of a drawer.
   * If the drawer doesn't exist in the state, this is a no-op.
   *
   * @param position - Which drawer to toggle ('left' or 'right')
   */
  public toggleDrawer(position: 'left' | 'right'): void {
    const currentState = this.drawerState.getValue()
    const drawerConfig = currentState[position]

    if (drawerConfig) {
      this.setDrawerOpen(position, !drawerConfig.open)
    }
  }

  /**
   * Sets the open state of a drawer.
   * Creates the drawer entry if it doesn't exist.
   *
   * @param position - Which drawer to modify ('left' or 'right')
   * @param open - Whether the drawer should be open
   */
  public setDrawerOpen(position: 'left' | 'right', open: boolean): void {
    const currentState = this.drawerState.getValue()
    const existingConfig = currentState[position]

    this.drawerState.setValue({
      ...currentState,
      [position]: {
        width: existingConfig?.width ?? '240px',
        variant: existingConfig?.variant ?? 'collapsible',
        open,
      },
    })
  }

  /**
   * Sets the width of a drawer.
   * Creates the drawer entry if it doesn't exist (defaults to closed).
   *
   * @param position - Which drawer to modify ('left' or 'right')
   * @param width - The CSS width value (e.g., '240px', '20rem')
   */
  public setDrawerWidth(position: 'left' | 'right', width: string): void {
    const currentState = this.drawerState.getValue()
    const existingConfig = currentState[position]

    this.drawerState.setValue({
      ...currentState,
      [position]: {
        open: existingConfig?.open ?? false,
        variant: existingConfig?.variant ?? 'collapsible',
        width,
      },
    })
  }

  /**
   * Initializes a drawer with the given configuration.
   * Use this when setting up a drawer for the first time.
   *
   * @param position - Which drawer to initialize ('left' or 'right')
   * @param config - Initial drawer configuration
   */
  public initDrawer(position: 'left' | 'right', config: DrawerSideState): void {
    const currentState = this.drawerState.getValue()

    this.drawerState.setValue({
      ...currentState,
      [position]: config,
    })
  }

  /**
   * Sets the top gap spacing between AppBar and content.
   *
   * @param gap - CSS value for the gap (e.g., '0px', '16px')
   */
  public setTopGap(gap: string): void {
    this.topGap.setValue(gap)
  }

  /**
   * Sets the side gap spacing for content padding.
   *
   * @param gap - CSS value for the gap (e.g., '0px', '16px')
   */
  public setSideGap(gap: string): void {
    this.sideGap.setValue(gap)
  }

  /**
   * Calculates the content margin for a drawer based on its variant and open state.
   *
   * - 'temporary': always '0px' (overlay, doesn't push content)
   * - 'permanent': always drawer width (always visible)
   * - 'collapsible': drawer width when open, '0px' when closed
   *
   * @param drawerState - The drawer state (may be undefined)
   * @returns The margin value to use
   */
  private getContentMarginForDrawer(drawerState: DrawerSideState | undefined): string {
    if (!drawerState) return '0px'

    switch (drawerState.variant) {
      case 'temporary':
        // Temporary drawers overlay content, never push
        return '0px'
      case 'permanent':
        // Permanent drawers always push content
        return drawerState.width
      case 'collapsible':
      default:
        // Collapsible drawers push content only when open
        return drawerState.open ? drawerState.width : '0px'
    }
  }

  /**
   * Updates CSS custom properties based on current layout state.
   * Called automatically when drawer state, AppBar height, or gap values change.
   */
  private updateCssVariables(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const state = this.drawerState.getValue()
    const appBarHeight = this.appBarHeight.getValue()
    const topGap = this.topGap.getValue()
    const sideGap = this.sideGap.getValue()

    // AppBar and gap values
    root.style.setProperty(LAYOUT_CSS_VARIABLES.appBarHeight, appBarHeight)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.topGap, topGap)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.sideGap, sideGap)

    // Content padding top (appBarHeight + topGap)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.contentPaddingTop, `calc(${appBarHeight} + ${topGap})`)

    // Content available height (100% - contentPaddingTop)
    root.style.setProperty(
      LAYOUT_CSS_VARIABLES.contentAvailableHeight,
      `calc(100% - var(${LAYOUT_CSS_VARIABLES.contentPaddingTop}))`,
    )

    // Legacy content margin top (deprecated, kept for backward compatibility)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginTop, appBarHeight)

    // Left drawer
    const leftConfiguredWidth = state.left?.width ?? '0px'
    const leftWidth = state.left?.open ? state.left.width : '0px'
    const leftContentMargin = this.getContentMarginForDrawer(state.left)

    root.style.setProperty(LAYOUT_CSS_VARIABLES.drawerLeftConfiguredWidth, leftConfiguredWidth)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.drawerLeftWidth, leftWidth)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginLeft, leftContentMargin)

    // Right drawer
    const rightConfiguredWidth = state.right?.width ?? '0px'
    const rightWidth = state.right?.open ? state.right.width : '0px'
    const rightContentMargin = this.getContentMarginForDrawer(state.right)

    root.style.setProperty(LAYOUT_CSS_VARIABLES.drawerRightConfiguredWidth, rightConfiguredWidth)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.drawerRightWidth, rightWidth)
    root.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginRight, rightContentMargin)
  }

  /**
   * Sets up subscriptions to automatically update CSS variables
   * when drawer state, AppBar height, or gap values change.
   */
  private setupCssVariableSync(): void {
    this.drawerStateSubscription = this.drawerState.subscribe(() => {
      this.updateCssVariables()
    })

    this.appBarHeightSubscription = this.appBarHeight.subscribe(() => {
      this.updateCssVariables()
    })

    this.topGapSubscription = this.topGap.subscribe(() => {
      this.updateCssVariables()
    })

    this.sideGapSubscription = this.sideGap.subscribe(() => {
      this.updateCssVariables()
    })
  }

  /**
   * Cleans up all resources held by the service.
   * Disposes subscriptions and observables.
   */
  public [Symbol.dispose](): void {
    // Clean up subscriptions
    this.drawerStateSubscription?.[Symbol.dispose]()
    this.drawerStateSubscription = null

    this.appBarHeightSubscription?.[Symbol.dispose]()
    this.appBarHeightSubscription = null

    this.topGapSubscription?.[Symbol.dispose]()
    this.topGapSubscription = null

    this.sideGapSubscription?.[Symbol.dispose]()
    this.sideGapSubscription = null

    // Dispose observables
    this.drawerState[Symbol.dispose]()
    this.appBarVisible[Symbol.dispose]()
    this.appBarHeight[Symbol.dispose]()
    this.topGap[Symbol.dispose]()
    this.sideGap[Symbol.dispose]()
  }
}
