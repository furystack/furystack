import { Injectable } from '@furystack/inject'
import { ObservableValue, type ValueObserver } from '@furystack/utils'

/**
 * Drawer configuration for a single side (left or right).
 */
export type DrawerSideState = {
  /** Whether the drawer is currently open */
  open: boolean
  /** Width of the drawer (CSS value, e.g., '240px') */
  width: string
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
 */
const CSS_VARIABLES = {
  appBarHeight: '--layout-appbar-height',
  drawerLeftWidth: '--layout-drawer-left-width',
  drawerRightWidth: '--layout-drawer-right-width',
  contentMarginTop: '--layout-content-margin-top',
  contentMarginLeft: '--layout-content-margin-left',
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

  private drawerStateSubscription: ValueObserver<DrawerState> | null = null
  private appBarHeightSubscription: ValueObserver<string> | null = null

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
   * Updates CSS custom properties based on current layout state.
   * Called automatically when drawer state or AppBar height changes.
   */
  private updateCssVariables(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const state = this.drawerState.getValue()
    const appBarHeight = this.appBarHeight.getValue()

    // AppBar height
    root.style.setProperty(CSS_VARIABLES.appBarHeight, appBarHeight)
    root.style.setProperty(CSS_VARIABLES.contentMarginTop, appBarHeight)

    // Left drawer width (0 when closed)
    const leftWidth = state.left?.open ? state.left.width : '0px'
    root.style.setProperty(CSS_VARIABLES.drawerLeftWidth, leftWidth)
    root.style.setProperty(CSS_VARIABLES.contentMarginLeft, leftWidth)

    // Right drawer width (0 when closed)
    const rightWidth = state.right?.open ? state.right.width : '0px'
    root.style.setProperty(CSS_VARIABLES.drawerRightWidth, rightWidth)
    root.style.setProperty(CSS_VARIABLES.contentMarginRight, rightWidth)
  }

  /**
   * Sets up subscriptions to automatically update CSS variables
   * when drawer state or AppBar height changes.
   */
  private setupCssVariableSync(): void {
    this.drawerStateSubscription = this.drawerState.subscribe(() => {
      this.updateCssVariables()
    })

    this.appBarHeightSubscription = this.appBarHeight.subscribe(() => {
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

    // Dispose observables
    this.drawerState[Symbol.dispose]()
    this.appBarVisible[Symbol.dispose]()
    this.appBarHeight[Symbol.dispose]()
  }
}
