import type { Injector, Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'

/**
 * Direction for spatial navigation movement.
 */
export type SpatialDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Configuration options for the SpatialNavigationService.
 */
export type SpatialNavigationOptions = {
  /** Whether spatial navigation is enabled on startup. Default: true */
  initiallyEnabled?: boolean
  /** Whether to allow cross-section navigation. Default: true */
  crossSectionNavigation?: boolean
  /** Custom focusable selector override */
  focusableSelector?: string
  /** Whether Backspace triggers history.back(). Default: false */
  backspaceGoesBack?: boolean
  /** Whether Escape moves focus to parent section. Default: false */
  escapeGoesToParentSection?: boolean
}

const DEFAULT_FOCUSABLE_SELECTOR = [
  '[tabindex]:not([tabindex="-1"])',
  '[data-spatial-nav-target]',
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(', ')

const INPUT_PASSTHROUGH_TAGS = new Set(['TEXTAREA', 'SELECT'])

/**
 * Input types treated as "text-like" for Enter suppression and Escape blur.
 * `number` is included here even though it also appears in
 * INPUT_VERTICAL_ONLY_PASSTHROUGH_TYPES — the overlap is intentional:
 * isTextInput gates Enter suppression and Escape-blur behavior, while
 * the vertical-only set gates which arrow keys pass through.
 */
const INPUT_PASSTHROUGH_TYPES = new Set([
  'text',
  'password',
  'email',
  'number',
  'search',
  'tel',
  'url',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
])

/**
 * Input types that always pass through all arrow keys because they use
 * arrows for built-in value manipulation (radio group cycling).
 */
const INPUT_FULL_ARROW_PASSTHROUGH_TYPES = new Set(['radio'])

/**
 * Input types where only Up/Down arrows should pass through when
 * selectionStart is unavailable (e.g. number inputs use Up/Down
 * for increment/decrement but Left/Right have no useful behavior).
 */
const INPUT_VERTICAL_ONLY_PASSTHROUGH_TYPES = new Set(['number'])

/**
 * Input types where only Left/Right arrows should pass through
 * (e.g. horizontal range sliders use Left/Right to adjust value
 * but Up/Down can be used for spatial navigation).
 */
const INPUT_HORIZONTAL_ONLY_PASSTHROUGH_TYPES = new Set(['range'])

const getElementCenter = (rect: DOMRect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
})

const PERPENDICULAR_WEIGHT = 3

/**
 * Weighted distance that penalizes perpendicular displacement.
 * For horizontal navigation (left/right), vertical offset is weighted 3x.
 * For vertical navigation (up/down), horizontal offset is weighted 3x.
 * This ensures elements aligned on the movement axis are strongly preferred.
 */
const spatialDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  direction: SpatialDirection,
): number => {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  const isHorizontal = direction === 'left' || direction === 'right'
  const primary = isHorizontal ? dx : dy
  const perpendicular = isHorizontal ? dy : dx
  return Math.sqrt(primary ** 2 + (perpendicular * PERPENDICULAR_WEIGHT) ** 2)
}

const isInDirection = (current: DOMRect, candidate: DOMRect, direction: SpatialDirection): boolean => {
  const currentCenter = getElementCenter(current)
  const candidateCenter = getElementCenter(candidate)

  switch (direction) {
    case 'right':
      return candidateCenter.x > currentCenter.x
    case 'left':
      return candidateCenter.x < currentCenter.x
    case 'down':
      return candidateCenter.y > currentCenter.y
    case 'up':
      return candidateCenter.y < currentCenter.y
    default:
      return false
  }
}

/**
 * Walks up the DOM checking the `contentEditable` property rather than
 * using `.closest('[contenteditable="true"]')` — the attribute selector
 * is unreliable in jsdom when contentEditable is set via the IDL property.
 */
const isInsideContentEditable = (element: Element): boolean => {
  let current: Element | null = element
  while (current) {
    if ((current as HTMLElement).contentEditable === 'true') return true
    current = current.parentElement
  }
  return false
}

const isTextInput = (element: Element): boolean => {
  if (INPUT_PASSTHROUGH_TAGS.has(element.tagName)) {
    return true
  }

  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type?.toLowerCase() || 'text'
    return INPUT_PASSTHROUGH_TYPES.has(type)
  }

  if (isInsideContentEditable(element)) {
    return true
  }

  return false
}

const isInsidePassthrough = (element: Element): boolean => {
  return !!element.closest('[data-spatial-nav-passthrough]')
}

const escapeCssString = (value: string): string =>
  typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/[^\w-]/g, (ch) => `\\${ch}`)

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

/**
 * Returns true when the focused element is an input-like control that
 * passes through arrow keys internally, meaning the user cannot escape
 * it via arrow keys alone (e.g. range, radio, date, time, textarea).
 * In these cases Escape should blur the element to resume spatial navigation.
 */
const shouldEscapeBlurElement = (element: Element): boolean => {
  if (isTextInput(element)) return true
  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type?.toLowerCase() || 'text'
    if (INPUT_FULL_ARROW_PASSTHROUGH_TYPES.has(type)) return true
    if (INPUT_HORIZONTAL_ONLY_PASSTHROUGH_TYPES.has(type)) return true
  }
  return false
}

/**
 * Determines whether an arrow key should be passed through to an input element.
 * Returns false (allowing spatial nav to take over) when the key press would
 * have no useful effect within the field:
 * - For text-like inputs: at cursor boundaries (start/end of text)
 * - For radio inputs: always pass through (built-in arrow key behavior)
 * - For range inputs: pass through Left/Right (slider adjustment), intercept Up/Down
 * - For number inputs: pass through Up/Down (increment/decrement), intercept Left/Right
 * - For date/time inputs: always pass through (internal segment navigation)
 */
const shouldPassthroughArrowKeys = (element: Element, key: string): boolean => {
  if (!ARROW_KEYS.has(key)) return false

  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type?.toLowerCase() || 'text'
    if (INPUT_FULL_ARROW_PASSTHROUGH_TYPES.has(type)) return true
    if (INPUT_HORIZONTAL_ONLY_PASSTHROUGH_TYPES.has(type)) {
      return key === 'ArrowLeft' || key === 'ArrowRight'
    }
  }

  if (!isTextInput(element)) return false

  // Textareas are multi-line editing areas; arrow keys always serve
  // editing purposes. Users exit via Tab or Escape.
  if (element.tagName === 'TEXTAREA') return true

  const el = element as HTMLInputElement | HTMLTextAreaElement

  if (typeof el.selectionStart !== 'number' || typeof el.selectionEnd !== 'number') {
    if (element.tagName === 'INPUT') {
      const type = (element as HTMLInputElement).type?.toLowerCase() || 'text'
      if (INPUT_VERTICAL_ONLY_PASSTHROUGH_TYPES.has(type)) {
        return key === 'ArrowUp' || key === 'ArrowDown'
      }
    }
    return true
  }

  const hasSelection = el.selectionStart !== el.selectionEnd
  if (hasSelection) return true

  const cursor = el.selectionStart
  const length = el.value?.length ?? 0

  if (key === 'ArrowUp' || key === 'ArrowLeft') {
    return cursor > 0
  }

  if (key === 'ArrowDown' || key === 'ArrowRight') {
    return cursor < length
  }

  return false
}

/**
 * Configuration token for {@link SpatialNavigationService}. Override via
 * {@link configureSpatialNavigation} before the service is first resolved.
 */
export const SpatialNavigationSettings: Token<SpatialNavigationOptions, 'singleton'> = defineService({
  name: '@furystack/shades/SpatialNavigationSettings',
  lifetime: 'singleton',
  factory: () => ({}),
})

/**
 * Service for D-pad / arrow-key spatial navigation across interactive elements.
 *
 * Intercepts arrow key events and moves focus spatially based on element geometry.
 * Supports section boundaries via `data-nav-section` attributes and optional
 * cross-section navigation.
 *
 * @example
 * ```typescript
 * // Opt in to spatial navigation
 * const spatialNav = injector.get(SpatialNavigationService)
 *
 * // Disable during video playback
 * spatialNav.enabled.setValue(false)
 * ```
 */
export interface SpatialNavigationService {
  readonly enabled: ObservableValue<boolean>
  readonly activeSection: ObservableValue<string | null>
  /** Push a focus trap onto the stack. Nesting is supported — only the topmost trap is enforced. */
  pushFocusTrap(sectionName: string): void
  /** Remove a focus trap from the stack. */
  popFocusTrap(sectionName: string, previousSection?: string | null): void
  /** Programmatically move focus in a direction */
  moveFocus(direction: SpatialDirection): void
  /** Programmatically activate (click) the currently focused element */
  activateFocused(): void
}

export const SpatialNavigationService: Token<SpatialNavigationService, 'singleton'> = defineService({
  name: '@furystack/shades/SpatialNavigationService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const options = inject(SpatialNavigationSettings)

    const enabled = new ObservableValue<boolean>(options.initiallyEnabled ?? true)
    const activeSection = new ObservableValue<string | null>(null)
    const focusMemory = new Map<string, WeakRef<Element>>()
    const focusTrapStack: string[] = []

    const focusableSelector = options.focusableSelector ?? DEFAULT_FOCUSABLE_SELECTOR
    const crossSectionNavigation = options.crossSectionNavigation ?? true
    const backspaceGoesBack = options.backspaceGoesBack ?? false
    const escapeGoesToParentSection = options.escapeGoesToParentSection ?? false

    const getActiveTrap = (): string | null => focusTrapStack[focusTrapStack.length - 1] ?? null

    const pushFocusTrap = (sectionName: string): void => {
      focusTrapStack.push(sectionName)
      activeSection.setValue(sectionName)
    }

    const popFocusTrap = (sectionName: string, previousSection?: string | null): void => {
      const idx = focusTrapStack.lastIndexOf(sectionName)
      if (idx !== -1) {
        focusTrapStack.splice(idx, 1)
      }
      const top = focusTrapStack[focusTrapStack.length - 1]
      activeSection.setValue(top ?? previousSection ?? null)
    }

    const findContainingSection = (element: Element): Element | null => element.closest('[data-nav-section]')

    const isVisibleInScrollContainers = (el: Element, rect: DOMRect): boolean => {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const hasOverflow = (val: string) => val !== '' && val !== 'visible'
      let ancestor = el.parentElement
      while (ancestor) {
        const style = getComputedStyle(ancestor)
        if (hasOverflow(style.overflow) || hasOverflow(style.overflowX) || hasOverflow(style.overflowY)) {
          const containerRect = ancestor.getBoundingClientRect()
          if (
            centerX < containerRect.left ||
            centerX > containerRect.right ||
            centerY < containerRect.top ||
            centerY > containerRect.bottom
          ) {
            return false
          }
        }
        ancestor = ancestor.parentElement
      }
      return true
    }

    const getFocusableCandidates = (
      root: Element | Document,
      exclude: Element,
      candidateOptions?: { skipScrollVisibility?: boolean },
    ): Element[] => {
      return Array.from(root.querySelectorAll(focusableSelector)).filter((el) => {
        if (el === exclude) return false
        if (!el.hasAttribute('data-spatial-nav-target') && el.closest('[data-spatial-nav-target]')) return false
        const rect = el.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return false
        if (candidateOptions?.skipScrollVisibility) return true
        return isVisibleInScrollContainers(el, rect)
      })
    }

    const findNearestInDirection = (
      currentRect: DOMRect,
      candidates: Element[],
      direction: SpatialDirection,
    ): HTMLElement | null => {
      const currentCenter = getElementCenter(currentRect)
      let nearest: HTMLElement | null = null
      let nearestDistance = Infinity

      for (const candidate of candidates) {
        const candidateRect = candidate.getBoundingClientRect()
        if (!isInDirection(currentRect, candidateRect, direction)) continue

        const candidateCenter = getElementCenter(candidateRect)
        const distance = spatialDistance(currentCenter, candidateCenter, direction)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = candidate as HTMLElement
        }
      }

      return nearest
    }

    const storeFocusMemory = (sectionName: string | null, element: Element): void => {
      if (sectionName) {
        focusMemory.set(sectionName, new WeakRef(element))
      }
    }

    const navigateCrossSection = (
      activeElement: Element,
      currentSection: Element,
      direction: SpatialDirection,
    ): void => {
      const currentSectionName = currentSection.getAttribute('data-nav-section')

      const allFocusable = Array.from(document.querySelectorAll(focusableSelector)).filter((el) => {
        if (el === activeElement) return false
        if (currentSection.contains(el)) return false
        if (!el.hasAttribute('data-spatial-nav-target') && el.closest('[data-spatial-nav-target]')) return false
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && isVisibleInScrollContainers(el, rect)
      })

      const currentRect = activeElement.getBoundingClientRect()
      const nearest = findNearestInDirection(currentRect, allFocusable, direction)

      if (nearest) {
        storeFocusMemory(currentSectionName, activeElement)

        const targetSection = findContainingSection(nearest)
        const targetSectionName = targetSection?.getAttribute('data-nav-section') ?? null

        const remembered = targetSectionName ? focusMemory.get(targetSectionName)?.deref() : null
        if (
          remembered &&
          remembered !== activeElement &&
          targetSection?.contains(remembered) &&
          remembered.matches(focusableSelector)
        ) {
          const rememberedRect = remembered.getBoundingClientRect()
          if (
            rememberedRect.width > 0 &&
            rememberedRect.height > 0 &&
            isVisibleInScrollContainers(remembered, rememberedRect)
          ) {
            ;(remembered as HTMLElement).focus()
            remembered.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            activeSection.setValue(targetSectionName)
            return
          }
        }

        nearest.focus()
        nearest.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        activeSection.setValue(targetSectionName)
      }
    }

    const focusFirstElement = (): void => {
      const trap = getActiveTrap()
      if (trap) {
        const trapSection = document.querySelector(`[data-nav-section="${escapeCssString(trap)}"]`)
        if (trapSection) {
          const firstFocusable = trapSection.querySelector(focusableSelector)
          if (firstFocusable) {
            ;(firstFocusable as HTMLElement).focus()
            activeSection.setValue(trap)
            return
          }
        }
      }

      const sections = document.querySelectorAll('[data-nav-section]')
      if (sections.length > 0) {
        const firstFocusable = sections[0].querySelector(focusableSelector)
        if (firstFocusable) {
          ;(firstFocusable as HTMLElement).focus()
          activeSection.setValue(sections[0].getAttribute('data-nav-section'))
          return
        }
      }

      const firstFocusable = document.querySelector(focusableSelector)
      if (firstFocusable) {
        ;(firstFocusable as HTMLElement).focus()
      }
    }

    const moveFocus = (direction: SpatialDirection): void => {
      const activeElement = document.activeElement as HTMLElement | null

      if (!activeElement || activeElement === document.body) {
        focusFirstElement()
        return
      }

      const currentSection = findContainingSection(activeElement)
      const currentSectionName = currentSection?.getAttribute('data-nav-section') ?? null
      activeSection.setValue(currentSectionName)

      const searchRoot = currentSection ?? document
      const candidates = getFocusableCandidates(searchRoot, activeElement)

      const currentRect = activeElement.getBoundingClientRect()
      let target = findNearestInDirection(currentRect, candidates, direction)

      if (!target) {
        const relaxedCandidates = getFocusableCandidates(searchRoot, activeElement, {
          skipScrollVisibility: true,
        })
        target = findNearestInDirection(currentRect, relaxedCandidates, direction)
      }

      if (target) {
        storeFocusMemory(currentSectionName, activeElement)
        target.focus()
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        const targetSection = findContainingSection(target)
        activeSection.setValue(targetSection?.getAttribute('data-nav-section') ?? null)
        return
      }

      if (crossSectionNavigation && currentSection && !getActiveTrap()) {
        navigateCrossSection(activeElement, currentSection, direction)
      }
    }

    const activateFocused = (): void => {
      const { activeElement } = document
      if (activeElement && activeElement !== document.body) {
        ;(activeElement as HTMLElement).click()
      }
    }

    const moveToParentSection = (): void => {
      const { activeElement } = document
      if (!activeElement || activeElement === document.body) return

      const currentSection = findContainingSection(activeElement)
      if (!currentSection) return

      const parentSection = currentSection.parentElement?.closest('[data-nav-section]')
      if (!parentSection) return

      const firstFocusable = parentSection.querySelector(focusableSelector)
      if (firstFocusable) {
        ;(firstFocusable as HTMLElement).focus()
        activeSection.setValue(parentSection.getAttribute('data-nav-section'))
      }
    }

    const handleKeyDown = (ev: KeyboardEvent): void => {
      if (!enabled.getValue()) return
      if (ev.defaultPrevented) return

      const { activeElement } = document
      if (activeElement && isInsidePassthrough(activeElement)) return
      if (activeElement && shouldPassthroughArrowKeys(activeElement, ev.key)) {
        return
      }

      switch (ev.key) {
        case 'ArrowUp':
          ev.preventDefault()
          moveFocus('up')
          break
        case 'ArrowDown':
          ev.preventDefault()
          moveFocus('down')
          break
        case 'ArrowLeft':
          ev.preventDefault()
          moveFocus('left')
          break
        case 'ArrowRight':
          ev.preventDefault()
          moveFocus('right')
          break
        case 'Enter':
          if (activeElement && isTextInput(activeElement)) break
          ev.preventDefault()
          activateFocused()
          break
        case 'Backspace':
          if (backspaceGoesBack && !(activeElement && isTextInput(activeElement))) {
            ev.preventDefault()
            history.back()
          }
          break
        case 'Escape':
          if (activeElement && activeElement !== document.body && shouldEscapeBlurElement(activeElement)) {
            ev.preventDefault()
            ;(activeElement as HTMLElement).blur()
            break
          }
          if (escapeGoesToParentSection) {
            moveToParentSection()
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    onDispose(() => {
      window.removeEventListener('keydown', handleKeyDown)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      enabled[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      activeSection[Symbol.dispose]()
      focusMemory.clear()
      focusTrapStack.length = 0
    })

    return {
      enabled,
      activeSection,
      pushFocusTrap,
      popFocusTrap,
      moveFocus,
      activateFocused,
    }
  },
})

/**
 * Configures spatial navigation options before the service is first instantiated.
 * Rebinds {@link SpatialNavigationSettings} and invalidates the cached
 * {@link SpatialNavigationService}. Must be called **before** the service is
 * first resolved — calling afterwards drops the cached instance without
 * disposing it (listeners leak until the injector is disposed).
 * @param injector The root injector.
 * @param options Configuration options for spatial navigation.
 */
export const configureSpatialNavigation = (injector: Injector, options: SpatialNavigationOptions): void => {
  injector.bind(SpatialNavigationSettings, () => options)
  injector.invalidate(SpatialNavigationSettings)
  injector.invalidate(SpatialNavigationService)
}
