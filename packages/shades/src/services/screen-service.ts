import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
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
 * Use `screenSize.atLeast[size]` to check if the viewport is at least a certain size.
 *
 * **Breakpoint Thresholds:**
 * - `xs`: 0px+
 * - `sm`: 600px+
 * - `md`: 960px+
 * - `lg`: 1280px+
 * - `xl`: 1920px+
 *
 * @example
 * ```typescript
 * const screenService = injector.get(ScreenService)
 *
 * if (screenService.screenSize.atLeast.md.getValue()) {
 *   // Desktop layout
 * }
 *
 * screenService.screenSize.atLeast.md.subscribe((isAtLeastMd) => {
 *   // react to breakpoint changes
 * })
 * ```
 */
export interface ScreenService {
  readonly breakpoints: { [K in ScreenSize]: { minSize: number } }
  readonly screenSize: {
    atLeast: { [K in ScreenSize]: ObservableValue<boolean> }
  }
  readonly orientation: ObservableValue<'landscape' | 'portrait'>
}

export const ScreenService: Token<ScreenService, 'singleton'> = defineService({
  name: '@furystack/shades/ScreenService',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const getOrientation = (): 'landscape' | 'portrait' =>
      window.matchMedia?.('(orientation:landscape').matches ? 'landscape' : 'portrait'

    const breakpoints: { [K in ScreenSize]: { minSize: number } } = {
      xl: { minSize: 1920 },
      lg: { minSize: 1280 },
      md: { minSize: 960 },
      sm: { minSize: 600 },
      xs: { minSize: 0 },
    }

    const screenSizeAtLeast = (size: ScreenSize): boolean => window.innerWidth >= breakpoints[size].minSize

    const atLeast: { [K in ScreenSize]: ObservableValue<boolean> } = {
      xs: new ObservableValue<boolean>(screenSizeAtLeast('xs')),
      sm: new ObservableValue<boolean>(screenSizeAtLeast('sm')),
      md: new ObservableValue<boolean>(screenSizeAtLeast('md')),
      lg: new ObservableValue<boolean>(screenSizeAtLeast('lg')),
      xl: new ObservableValue<boolean>(screenSizeAtLeast('xl')),
    }

    const orientation = new ObservableValue<'landscape' | 'portrait'>(getOrientation())

    const refreshValues = (): void => {
      orientation.setValue(getOrientation())
      for (const size of ScreenSizes) {
        atLeast[size].setValue(screenSizeAtLeast(size))
      }
    }

    const onResizeListener = (): void => {
      refreshValues()
    }

    window.addEventListener('resize', onResizeListener)
    refreshValues()

    onDispose(() => {
      window.removeEventListener('resize', onResizeListener)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      orientation[Symbol.dispose]()
      Object.values(atLeast).forEach((observable) => observable[Symbol.dispose]())
    })

    return {
      breakpoints,
      screenSize: { atLeast },
      orientation,
    }
  },
})
