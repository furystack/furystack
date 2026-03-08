import { Injectable, type Injector } from '@furystack/inject'
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
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(', ')

const INPUT_PASSTHROUGH_TAGS = new Set(['TEXTAREA', 'SELECT'])

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
  'color',
  'range',
  'file',
])

const getElementCenter = (rect: DOMRect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
})

const euclideanDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

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

const getSectionCenter = (section: Element): { x: number; y: number } => {
  const rect = section.getBoundingClientRect()
  return getElementCenter(rect)
}

const isTextInput = (element: Element): boolean => {
  if (INPUT_PASSTHROUGH_TAGS.has(element.tagName)) {
    return true
  }

  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type?.toLowerCase() || 'text'
    return INPUT_PASSTHROUGH_TYPES.has(type)
  }

  if ((element as HTMLElement).contentEditable === 'true') {
    return true
  }

  return false
}

/**
 * Determines whether an arrow key should be passed through to a text input.
 * Returns false (allowing spatial nav to take over) when the cursor is at a
 * boundary where the arrow key would have no effect within the field:
 * - ArrowUp / ArrowLeft at the start of the text
 * - ArrowDown / ArrowRight at the end of the text
 * This enables D-pad escape from inputs without breaking normal text editing.
 */
const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

/**
 * Determines whether an arrow key should be passed through to a text input.
 * Returns false (allowing spatial nav to take over) when the cursor is at a
 * boundary where the arrow key would have no effect within the field:
 * - ArrowUp / ArrowLeft at the start of the text
 * - ArrowDown / ArrowRight at the end of the text
 * This enables D-pad escape from inputs without breaking normal text editing.
 */
const shouldPassthroughArrowKeys = (element: Element, key: string): boolean => {
  if (!ARROW_KEYS.has(key)) return false
  if (!isTextInput(element)) return false

  const el = element as HTMLInputElement | HTMLTextAreaElement

  if (typeof el.selectionStart !== 'number' || typeof el.selectionEnd !== 'number') {
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
 * Service for D-pad / arrow-key spatial navigation across interactive elements.
 *
 * Intercepts arrow key events and moves focus spatially based on element geometry.
 * Supports section boundaries via `data-nav-section` attributes and optional
 * cross-section navigation.
 *
 * @example
 * ```typescript
 * // Opt in to spatial navigation
 * const spatialNav = injector.getInstance(SpatialNavigationService)
 *
 * // Disable during video playback
 * spatialNav.enabled.setValue(false)
 *
 * // Re-enable
 * spatialNav.enabled.setValue(true)
 * ```
 */
@Injectable({ lifetime: 'singleton' })
export class SpatialNavigationService implements Disposable {
  /** Toggle spatial navigation on/off at runtime */
  public readonly enabled: ObservableValue<boolean>

  /** The currently active section name (from data-nav-section), or null if none */
  public readonly activeSection = new ObservableValue<string | null>(null)

  /** Remembered last-focused element per section for focus restoration */
  public readonly focusMemory = new Map<string, WeakRef<Element>>()

  private readonly focusableSelector: string
  private readonly crossSectionNavigation: boolean
  private readonly backspaceGoesBack: boolean
  private readonly escapeGoesToParentSection: boolean

  constructor(options: SpatialNavigationOptions = {}) {
    this.enabled = new ObservableValue<boolean>(options.initiallyEnabled ?? true)
    this.focusableSelector = options.focusableSelector ?? DEFAULT_FOCUSABLE_SELECTOR
    this.crossSectionNavigation = options.crossSectionNavigation ?? true
    this.backspaceGoesBack = options.backspaceGoesBack ?? false
    this.escapeGoesToParentSection = options.escapeGoesToParentSection ?? false

    window.addEventListener('keydown', this.handleKeyDown)
  }

  public [Symbol.dispose](): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    this.enabled[Symbol.dispose]()
    this.activeSection[Symbol.dispose]()
    this.focusMemory.clear()
  }

  /** Programmatically move focus in a direction */
  public moveFocus(direction: SpatialDirection): void {
    const activeElement = document.activeElement as HTMLElement | null

    if (!activeElement || activeElement === document.body) {
      this.focusFirstElement()
      return
    }

    const currentSection = this.findContainingSection(activeElement)
    const currentSectionName = currentSection?.getAttribute('data-nav-section') ?? null
    this.activeSection.setValue(currentSectionName)

    const searchRoot = currentSection ?? document
    const candidates = this.getFocusableCandidates(searchRoot, activeElement)

    const currentRect = activeElement.getBoundingClientRect()
    const target = this.findNearestInDirection(currentRect, candidates, direction)

    if (target) {
      this.storeFocusMemory(currentSectionName, activeElement)
      target.focus()
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      const targetSection = this.findContainingSection(target)
      this.activeSection.setValue(targetSection?.getAttribute('data-nav-section') ?? null)
      return
    }

    if (this.crossSectionNavigation && currentSection) {
      this.navigateCrossSection(activeElement, currentSection, direction)
    }
  }

  /** Programmatically activate (click) the currently focused element */
  public activateFocused(): void {
    const { activeElement } = document
    if (activeElement && activeElement !== document.body) {
      activeElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    }
  }

  private handleKeyDown = (ev: KeyboardEvent): void => {
    if (!this.enabled.getValue()) return
    if (ev.defaultPrevented) return

    const { activeElement } = document
    if (activeElement && shouldPassthroughArrowKeys(activeElement, ev.key)) {
      return
    }

    switch (ev.key) {
      case 'ArrowUp':
        ev.preventDefault()
        this.moveFocus('up')
        break
      case 'ArrowDown':
        ev.preventDefault()
        this.moveFocus('down')
        break
      case 'ArrowLeft':
        ev.preventDefault()
        this.moveFocus('left')
        break
      case 'ArrowRight':
        ev.preventDefault()
        this.moveFocus('right')
        break
      case 'Enter':
        ev.preventDefault()
        this.activateFocused()
        break
      case 'Backspace':
        if (this.backspaceGoesBack) {
          ev.preventDefault()
          history.back()
        }
        break
      case 'Escape':
        if (this.escapeGoesToParentSection) {
          this.moveToParentSection()
        }
        break
      default:
        break
    }
  }

  private focusFirstElement(): void {
    const sections = document.querySelectorAll('[data-nav-section]')
    if (sections.length > 0) {
      const firstFocusable = sections[0].querySelector(this.focusableSelector)
      if (firstFocusable) {
        ;(firstFocusable as HTMLElement).focus()
        this.activeSection.setValue(sections[0].getAttribute('data-nav-section'))
        return
      }
    }

    const firstFocusable = document.querySelector(this.focusableSelector)
    if (firstFocusable) {
      ;(firstFocusable as HTMLElement).focus()
    }
  }

  private findContainingSection(element: Element): Element | null {
    return element.closest('[data-nav-section]')
  }

  private getFocusableCandidates(root: Element | Document, exclude: Element): Element[] {
    return Array.from(root.querySelectorAll(this.focusableSelector)).filter((el) => {
      if (el === exclude) return false
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
  }

  private findNearestInDirection(
    currentRect: DOMRect,
    candidates: Element[],
    direction: SpatialDirection,
  ): HTMLElement | null {
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

  private navigateCrossSection(activeElement: Element, currentSection: Element, direction: SpatialDirection): void {
    const allSections = Array.from(document.querySelectorAll('[data-nav-section]'))
    const currentSectionRect = currentSection.getBoundingClientRect()
    const currentSectionCenter = getSectionCenter(currentSection)
    const currentSectionName = currentSection.getAttribute('data-nav-section')

    let nearestSection: Element | null = null
    let nearestDistance = Infinity

    for (const section of allSections) {
      if (section === currentSection) continue
      if (currentSection.contains(section) || section.contains(currentSection)) continue

      const sectionRect = section.getBoundingClientRect()
      if (!isInDirection(currentSectionRect, sectionRect, direction)) continue

      const sectionCenter = getSectionCenter(section)
      const distance = euclideanDistance(currentSectionCenter, sectionCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestSection = section
      }
    }

    if (nearestSection) {
      this.focusInSection(nearestSection, activeElement, currentSectionName, direction)
      return
    }

    this.focusUnsectionedElement(activeElement, currentSection, currentSectionName, direction)
  }

  private focusInSection(
    section: Element,
    activeElement: Element,
    previousSectionName: string | null,
    direction: SpatialDirection,
  ): void {
    this.storeFocusMemory(previousSectionName, activeElement)

    const targetSectionName = section.getAttribute('data-nav-section')
    const remembered = targetSectionName ? this.focusMemory.get(targetSectionName)?.deref() : null
    if (remembered && section.contains(remembered)) {
      ;(remembered as HTMLElement).focus()
      remembered.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      this.activeSection.setValue(targetSectionName)
      return
    }

    const candidates = this.getFocusableCandidates(section, activeElement)
    const currentRect = activeElement.getBoundingClientRect()
    const nearest = this.findNearestInDirection(currentRect, candidates, direction)

    if (nearest) {
      nearest.focus()
      nearest.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      this.activeSection.setValue(targetSectionName)
      return
    }

    const firstFocusable = section.querySelector(this.focusableSelector)
    if (firstFocusable) {
      ;(firstFocusable as HTMLElement).focus()
      ;(firstFocusable as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' })
      this.activeSection.setValue(targetSectionName)
    }
  }

  private focusUnsectionedElement(
    activeElement: Element,
    currentSection: Element,
    currentSectionName: string | null,
    direction: SpatialDirection,
  ): void {
    const allFocusable = Array.from(document.querySelectorAll(this.focusableSelector)).filter((el) => {
      if (el === activeElement) return false
      if (currentSection.contains(el)) return false
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })

    const currentRect = activeElement.getBoundingClientRect()
    const nearest = this.findNearestInDirection(currentRect, allFocusable, direction)

    if (nearest) {
      this.storeFocusMemory(currentSectionName, activeElement)
      nearest.focus()
      nearest.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      const targetSection = this.findContainingSection(nearest)
      this.activeSection.setValue(targetSection?.getAttribute('data-nav-section') ?? null)
    }
  }

  private storeFocusMemory(sectionName: string | null, element: Element): void {
    if (sectionName) {
      this.focusMemory.set(sectionName, new WeakRef(element))
    }
  }

  private moveToParentSection(): void {
    const { activeElement } = document
    if (!activeElement || activeElement === document.body) return

    const currentSection = this.findContainingSection(activeElement)
    if (!currentSection) return

    const parentSection = currentSection.parentElement?.closest('[data-nav-section]')
    if (!parentSection) return

    const firstFocusable = parentSection.querySelector(this.focusableSelector)
    if (firstFocusable) {
      ;(firstFocusable as HTMLElement).focus()
      this.activeSection.setValue(parentSection.getAttribute('data-nav-section'))
    }
  }
}

/**
 * Configures spatial navigation options before the service is first instantiated.
 * Must be called **before** `SpatialNavigationService` is first resolved from the injector.
 * @param injector The root injector
 * @param options Configuration options for spatial navigation
 */
export const configureSpatialNavigation = (injector: Injector, options: SpatialNavigationOptions): void => {
  if (injector.cachedSingletons.has(SpatialNavigationService)) {
    throw new Error('configureSpatialNavigation must be called before the SpatialNavigationService is instantiated')
  }

  const service = new SpatialNavigationService(options)
  injector.setExplicitInstance(service, SpatialNavigationService)
}
