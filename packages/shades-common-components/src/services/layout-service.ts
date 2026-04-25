import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
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
  open: boolean
  width: string
  variant: DrawerVariant
}

/**
 * State for all drawers in the layout.
 */
export type DrawerState = {
  left?: DrawerSideState
  right?: DrawerSideState
}

/**
 * CSS variable names managed by LayoutService. Exposed so consumer components
 * can reference the same names in their own CSS.
 */
export const LAYOUT_CSS_VARIABLES = {
  appBarHeight: '--layout-appbar-height',
  topGap: '--layout-top-gap',
  sideGap: '--layout-side-gap',
  contentPaddingTop: '--layout-content-padding-top',
  drawerLeftWidth: '--layout-drawer-left-width',
  drawerRightWidth: '--layout-drawer-right-width',
  drawerLeftConfiguredWidth: '--layout-drawer-left-configured-width',
  drawerRightConfiguredWidth: '--layout-drawer-right-configured-width',
  contentMarginTop: '--layout-content-margin-top',
  contentMarginLeft: '--layout-content-margin-left',
  contentMarginRight: '--layout-content-margin-right',
} as const

/**
 * Thrown when a component tries to resolve {@link LayoutService} but no
 * `<PageLayout>` ancestor has bound one on its scoped injector.
 */
export class LayoutServiceNotConfiguredError extends Error {
  constructor() {
    super(
      'LayoutService is not configured on this injector scope. Render components that depend on LayoutService inside a <PageLayout>.',
    )
    this.name = 'LayoutServiceNotConfiguredError'
  }
}

/**
 * Scoped service managing layout state within a PageLayout component.
 *
 * Exposes observables for drawer state, AppBar visibility, gap values and a
 * set of CSS custom properties that are optionally mirrored onto a target
 * element.
 */
export interface LayoutService extends Disposable {
  readonly drawerState: ObservableValue<DrawerState>
  readonly appBarVisible: ObservableValue<boolean>
  readonly appBarVariant: ObservableValue<AppBarVariant>
  readonly appBarHeight: ObservableValue<string>
  readonly topGap: ObservableValue<string>
  readonly sideGap: ObservableValue<string>
  toggleDrawer(position: 'left' | 'right'): void
  setDrawerOpen(position: 'left' | 'right', open: boolean): void
  setDrawerWidth(position: 'left' | 'right', width: string): void
  initDrawer(position: 'left' | 'right', config: DrawerSideState): void
  removeDrawer(position: 'left' | 'right'): void
  setTopGap(gap: string): void
  setSideGap(gap: string): void
  getContentMarginForPosition(position: 'left' | 'right'): string
}

/**
 * Creates a fresh {@link LayoutService} instance. Used by `<PageLayout>` to
 * bind a per-scope service inside a child injector. Consumer code should go
 * through the {@link LayoutService} token rather than calling this directly.
 * @param targetElement - Optional element (or ref) that will have CSS variables
 *   applied as the layout state changes. When omitted, CSS variables are not
 *   written — the page-layout component applies them via host props instead.
 */
export const createLayoutService = (
  targetElement?: HTMLElement | { readonly current: HTMLElement | null },
): LayoutService => {
  const drawerState = new ObservableValue<DrawerState>({})
  const appBarVisible = new ObservableValue<boolean>(true)
  const appBarVariant = new ObservableValue<AppBarVariant>('permanent')
  const appBarHeight = new ObservableValue<string>('48px')
  const topGap = new ObservableValue<string>('0px')
  const sideGap = new ObservableValue<string>('0px')

  const getTarget = (): HTMLElement | undefined => {
    if (!targetElement) return undefined
    if ('current' in targetElement) return targetElement.current ?? undefined
    return targetElement
  }

  const getContentMarginForDrawer = (state: DrawerSideState | undefined): string => {
    if (!state) return '0px'
    switch (state.variant) {
      case 'temporary':
        return '0px'
      case 'permanent':
        return state.width
      case 'collapsible':
      default:
        return state.open ? state.width : '0px'
    }
  }

  const updateCssVariables = (): void => {
    const target = getTarget()
    if (!target) return

    const state = drawerState.getValue()
    const appBarHeightValue = appBarHeight.getValue()
    const appBarVariantValue = appBarVariant.getValue()
    const topGapValue = topGap.getValue()
    const sideGapValue = sideGap.getValue()

    target.style.setProperty(LAYOUT_CSS_VARIABLES.appBarHeight, appBarHeightValue)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.topGap, topGapValue)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.sideGap, sideGapValue)

    const contentPaddingTop =
      appBarVariantValue === 'auto-hide' ? topGapValue : `calc(${appBarHeightValue} + ${topGapValue})`
    target.style.setProperty(LAYOUT_CSS_VARIABLES.contentPaddingTop, contentPaddingTop)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginTop, appBarHeightValue)

    const leftConfiguredWidth = state.left?.width ?? '0px'
    const leftWidth = state.left?.open ? state.left.width : '0px'
    const leftContentMargin = getContentMarginForDrawer(state.left)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.drawerLeftConfiguredWidth, leftConfiguredWidth)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.drawerLeftWidth, leftWidth)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginLeft, leftContentMargin)

    const rightConfiguredWidth = state.right?.width ?? '0px'
    const rightWidth = state.right?.open ? state.right.width : '0px'
    const rightContentMargin = getContentMarginForDrawer(state.right)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.drawerRightConfiguredWidth, rightConfiguredWidth)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.drawerRightWidth, rightWidth)
    target.style.setProperty(LAYOUT_CSS_VARIABLES.contentMarginRight, rightContentMargin)
  }

  const subscriptions: Array<ValueObserver<unknown>> = []
  const track = <T>(observable: ObservableValue<T>): void => {
    subscriptions.push(observable.subscribe(() => updateCssVariables()) as ValueObserver<unknown>)
  }
  track(drawerState)
  track(appBarHeight)
  track(appBarVariant)
  track(topGap)
  track(sideGap)

  updateCssVariables()

  const setDrawerOpen = (position: 'left' | 'right', open: boolean): void => {
    const currentState = drawerState.getValue()
    const existingConfig = currentState[position]
    drawerState.setValue({
      ...currentState,
      [position]: {
        width: existingConfig?.width ?? '240px',
        variant: existingConfig?.variant ?? 'collapsible',
        open,
      },
    })
  }

  const setDrawerWidth = (position: 'left' | 'right', width: string): void => {
    const currentState = drawerState.getValue()
    const existingConfig = currentState[position]
    drawerState.setValue({
      ...currentState,
      [position]: {
        open: existingConfig?.open ?? false,
        variant: existingConfig?.variant ?? 'collapsible',
        width,
      },
    })
  }

  const initDrawer = (position: 'left' | 'right', config: DrawerSideState): void => {
    drawerState.setValue({ ...drawerState.getValue(), [position]: config })
  }

  const removeDrawer = (position: 'left' | 'right'): void => {
    if (drawerState.isDisposed) return
    const currentState = drawerState.getValue()
    if (currentState[position]) {
      const { [position]: _, ...rest } = currentState
      drawerState.setValue(rest)
    }
  }

  const toggleDrawer = (position: 'left' | 'right'): void => {
    const currentState = drawerState.getValue()
    const drawerConfig = currentState[position]
    if (drawerConfig) {
      setDrawerOpen(position, !drawerConfig.open)
    }
  }

  return {
    drawerState,
    appBarVisible,
    appBarVariant,
    appBarHeight,
    topGap,
    sideGap,
    toggleDrawer,
    setDrawerOpen,
    setDrawerWidth,
    initDrawer,
    removeDrawer,
    setTopGap: (gap) => topGap.setValue(gap),
    setSideGap: (gap) => sideGap.setValue(gap),
    getContentMarginForPosition: (position) => getContentMarginForDrawer(drawerState.getValue()[position]),
    [Symbol.dispose](): void {
      for (const subscription of subscriptions) {
        subscription[Symbol.dispose]()
      }
      subscriptions.length = 0
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <PageLayout> via useDisposable.
      drawerState[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <PageLayout> via useDisposable.
      appBarVisible[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <PageLayout> via useDisposable.
      appBarVariant[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <PageLayout> via useDisposable.
      appBarHeight[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <PageLayout> via useDisposable.
      topGap[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <PageLayout> via useDisposable.
      sideGap[Symbol.dispose]()
    },
  }
}

/**
 * Scoped {@link LayoutService} token. The default factory throws — a
 * `<PageLayout>` ancestor binds a real instance on its child scope via
 * {@link createLayoutService}.
 */
export const LayoutService: Token<LayoutService, 'scoped'> = defineService({
  name: '@furystack/shades-common-components/LayoutService',
  lifetime: 'scoped',
  factory: () => {
    throw new LayoutServiceNotConfiguredError()
  },
})
