import { Injectable } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'

/**
 * Available screen size breakpoint identifiers, ordered from smallest to largest.
 */
export const ScreenSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

/**
 * A screen size breakpoint identifier.
 */
export type ScreenSize = (typeof ScreenSizes)[number]

/**
 * Breakpoint definition with name and size constraints.
 */
export type Breakpoint = { name: ScreenSize; minSize: number; maxSize?: number }

/**
 * Service for detecting and subscribing to screen size and orientation changes.
 *
 * This service provides reactive observables for responsive design decisions.
 * Use `screenSize.atLeast[size]` to check if the viewport is at least a certain size.
 *
 * **Breakpoint Thresholds:**
 * - `xs`: 0px+ (all sizes)
 * - `sm`: 600px+ (small tablets and up)
 * - `md`: 960px+ (tablets and up)
 * - `lg`: 1280px+ (desktops and up)
 * - `xl`: 1920px+ (large desktops)
 *
 * @example
 * ```typescript
 * const screenService = injector.getInstance(ScreenService);
 *
 * // Check if screen is at least medium size
 * if (screenService.screenSize.atLeast.md.getValue()) {
 *   // Show desktop layout
 * }
 *
 * // Subscribe to size changes for responsive behavior
 * screenService.screenSize.atLeast.md.subscribe((isAtLeastMd) => {
 *   if (isAtLeastMd) {
 *     console.log('Desktop or tablet view');
 *   } else {
 *     console.log('Mobile view');
 *   }
 * });
 *
 * // Get current breakpoint by checking from largest to smallest
 * const getCurrentBreakpoint = (): ScreenSize => {
 *   if (screenService.screenSize.atLeast.xl.getValue()) return 'xl';
 *   if (screenService.screenSize.atLeast.lg.getValue()) return 'lg';
 *   if (screenService.screenSize.atLeast.md.getValue()) return 'md';
 *   if (screenService.screenSize.atLeast.sm.getValue()) return 'sm';
 *   return 'xs';
 * };
 *
 * // Subscribe to orientation changes
 * screenService.orientation.subscribe((orientation) => {
 *   console.log(`Screen is now in ${orientation} mode`);
 * });
 * ```
 */
@Injectable({ lifetime: 'singleton' })
export class ScreenService implements Disposable {
  private getOrientation = () => (window.matchMedia?.('(orientation:landscape').matches ? 'landscape' : 'portrait')

  /**
   * The definitions of the breakpoint thresholds in pixels.
   * Each breakpoint represents the minimum width for that size category.
   */
  public readonly breakpoints: { [K in ScreenSize]: { minSize: number } } = {
    xl: { minSize: 1920 },
    lg: { minSize: 1280 },
    md: { minSize: 960 },
    sm: { minSize: 600 },
    xs: { minSize: 0 },
  }

  /**
   * Cleans up event listeners when the service is disposed.
   */
  public [Symbol.dispose]() {
    window.removeEventListener('resize', this.onResizeListener)
  }

  /**
   * Observable values for checking if the screen is at least a certain size.
   *
   * Each observable emits `true` when the viewport width is >= the breakpoint threshold,
   * and `false` otherwise. Values update automatically on window resize.
   *
   * @example
   * ```typescript
   * // Hide sidebar on small screens
   * screenService.screenSize.atLeast.md.subscribe((isAtLeastMd) => {
   *   sidebarVisible.setValue(isAtLeastMd);
   * });
   * ```
   */
  public readonly screenSize: {
    atLeast: { [K in ScreenSize]: ObservableValue<boolean> }
  } = {
    atLeast: {
      xs: new ObservableValue<boolean>(this.screenSizeAtLeast('xs')),
      sm: new ObservableValue<boolean>(this.screenSizeAtLeast('sm')),
      md: new ObservableValue<boolean>(this.screenSizeAtLeast('md')),
      lg: new ObservableValue<boolean>(this.screenSizeAtLeast('lg')),
      xl: new ObservableValue<boolean>(this.screenSizeAtLeast('xl')),
    },
  }

  private screenSizeAtLeast(size: ScreenSize) {
    return window.innerWidth >= this.breakpoints[size].minSize
  }

  /**
   * Observable value for tracking the screen orientation.
   * Emits 'landscape' or 'portrait' based on the current viewport dimensions.
   *
   * @example
   * ```typescript
   * screenService.orientation.subscribe((orientation) => {
   *   if (orientation === 'landscape') {
   *     // Adjust layout for landscape mode
   *   }
   * });
   * ```
   */
  public orientation = new ObservableValue<'landscape' | 'portrait'>(this.getOrientation())

  private onResizeListener = () => {
    this.refreshValues()
  }

  private refreshValues() {
    this.orientation.setValue(this.getOrientation())
    ScreenSizes.forEach((size) => {
      this.screenSize.atLeast[size].setValue(this.screenSizeAtLeast(size))
    })
  }

  constructor() {
    window.addEventListener('resize', this.onResizeListener)
    this.refreshValues()
  }
}
