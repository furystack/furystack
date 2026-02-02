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
 * AppBar variant that determines visibility behavior.
 * - 'permanent': Always visible, pushes content down
 * - 'auto-hide': Hidden by default, overlays content when visible (on hover or programmatically)
 */
export type AppBarVariant = 'permanent' | 'auto-hide'

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
 * These variables are set on the PageLayout host element for scoped access.
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
 * Scoped service for managing layout state within a PageLayout component.
 *
 * This service is created per PageLayout instance and sets CSS variables on the
 * host element rather than document.documentElement, providing proper scoping.
 *
 * Manages:
 * - Drawer open/close state and widths
 * - AppBar visibility (for auto-hide mode)
 * - CSS custom properties for layout dimensions (scoped to the PageLayout)
 *
 * **Note:** For responsive breakpoint detection, use `ScreenService` from `@furystack/shades`.
 * ScreenService provides `screenSize.atLeast[size]` observables for responsive behavior.
 *
 * @example
 * ```typescript
 * // Get layout service from injector (must be inside PageLayout)
 * const layoutService = injector.getInstance(LayoutService);
 *
 * // Toggle left drawer
 * layoutService.toggleDrawer('left');
 * ```
 */
@Injectable({ lifetime: 'explicit' })
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
   * AppBar variant that determines visibility behavior.
   * - 'permanent': Always visible, content has padding for appbar
   * - 'auto-hide': Hidden by default, overlays content when visible
   */
  public appBarVariant = new ObservableValue<AppBarVariant>('permanent')

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
  private appBarVariantSubscription: ValueObserver<AppBarVariant> | null = null
  private topGapSubscription: ValueObserver<string> | null = null
  private sideGapSubscription: ValueObserver<string> | null = null

  /**
   * Creates a new LayoutService instance scoped to the given element.
   *
   * @param targetElement - The element to set CSS variables on (typically the PageLayout host).
   *                        If undefined (e.g., in SSR), CSS variables won't be set.
   */
  constructor(private targetElement?: HTMLElement) {
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
   * Called automatically when drawer state, AppBar height, variant, or gap values change.
   */
  private updateCssVariables(): void {
    if (!this.targetElement) return

    const state = this.drawerState.getValue()
    const appBarHeight = this.appBarHeight.getValue()
    const appBarVariant = this.appBarVariant.getValue()
    const topGap = this.topGap.getValue()
    const sideGap = this.sideGap.getValue()

    // AppBar and gap values
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.appBarHeight, appBarHeight)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.topGap, topGap)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.sideGap, sideGap)

    // Content padding top:
    // - For 'permanent' appbar: appBarHeight + topGap (content pushed below appbar)
    // - For 'auto-hide' appbar: just topGap (appbar overlays content when visible)
    const contentPaddingTop = appBarVariant === 'auto-hide' ? topGap : `calc(${appBarHeight} + ${topGap})`
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.contentPaddingTop, contentPaddingTop)

    // Legacy content margin top (deprecated, kept for backward compatibility)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginTop, appBarHeight)

    // Left drawer
    const leftConfiguredWidth = state.left?.width ?? '0px'
    const leftWidth = state.left?.open ? state.left.width : '0px'
    const leftContentMargin = this.getContentMarginForDrawer(state.left)

    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.drawerLeftConfiguredWidth, leftConfiguredWidth)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.drawerLeftWidth, leftWidth)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginLeft, leftContentMargin)

    // Right drawer
    const rightConfiguredWidth = state.right?.width ?? '0px'
    const rightWidth = state.right?.open ? state.right.width : '0px'
    const rightContentMargin = this.getContentMarginForDrawer(state.right)

    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.drawerRightConfiguredWidth, rightConfiguredWidth)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.drawerRightWidth, rightWidth)
    this.targetElement.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginRight, rightContentMargin)
  }

  /**
   * Sets up subscriptions to automatically update CSS variables
   * when drawer state, AppBar height, variant, or gap values change.
   */
  private setupCssVariableSync(): void {
    this.drawerStateSubscription = this.drawerState.subscribe(() => {
      this.updateCssVariables()
    })

    this.appBarHeightSubscription = this.appBarHeight.subscribe(() => {
      this.updateCssVariables()
    })

    this.appBarVariantSubscription = this.appBarVariant.subscribe(() => {
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

    this.appBarVariantSubscription?.[Symbol.dispose]()
    this.appBarVariantSubscription = null

    this.topGapSubscription?.[Symbol.dispose]()
    this.topGapSubscription = null

    this.sideGapSubscription?.[Symbol.dispose]()
    this.sideGapSubscription = null

    // Dispose observables
    this.drawerState[Symbol.dispose]()
    this.appBarVisible[Symbol.dispose]()
    this.appBarVariant[Symbol.dispose]()
    this.appBarHeight[Symbol.dispose]()
    this.topGap[Symbol.dispose]()
    this.sideGap[Symbol.dispose]()
  }
}
