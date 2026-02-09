import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'

/**
 * Represents a mark on the slider track
 */
export type SliderMark = {
  /** The value at which to place the mark */
  value: number
  /** Optional label text displayed near the mark */
  label?: string
}

/**
 * Props for the Slider component
 */
export type SliderProps = {
  /**
   * Current value. A single number for standard mode, or a [min, max] tuple for range mode.
   */
  value?: number | [number, number]
  /**
   * Minimum allowed value
   * @default 0
   */
  min?: number
  /**
   * Maximum allowed value
   * @default 100
   */
  max?: number
  /**
   * Step increment. Set to 0 for continuous (no snapping).
   * @default 1
   */
  step?: number
  /**
   * Whether the slider is disabled
   */
  disabled?: boolean
  /**
   * The palette color for the slider
   * @default 'primary'
   */
  color?: keyof Palette
  /**
   * Whether to render the slider vertically
   */
  vertical?: boolean
  /**
   * Display marks on the slider.
   * `true` auto-generates a mark at each step; an array of SliderMark objects places custom marks.
   */
  marks?: boolean | SliderMark[]
  /**
   * Callback fired when the value changes during interaction
   */
  onValueChange?: (value: number | [number, number]) => void
  /**
   * The name attribute for a hidden input (form integration)
   */
  name?: string
}

const valueToPercent = (value: number, min: number, max: number): number => {
  if (max === min) return 0
  return ((value - min) / (max - min)) * 100
}

const percentToValue = (percent: number, min: number, max: number): number => {
  return min + (percent / 100) * (max - min)
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

const snapToStep = (value: number, step: number, min: number, max: number): number => {
  if (step <= 0) return clamp(value, min, max)
  const snapped = Math.round((value - min) / step) * step + min
  const decimals = String(step).split('.')[1]?.length ?? 0
  return clamp(Number(snapped.toFixed(decimals)), min, max)
}

const resolveMarks = (
  marks: boolean | SliderMark[] | undefined,
  min: number,
  max: number,
  step: number,
): SliderMark[] => {
  if (!marks) return []
  if (Array.isArray(marks)) return marks
  if (step <= 0) return []
  const result: SliderMark[] = []
  const decimals = String(step).split('.')[1]?.length ?? 0
  for (let v = min; v <= max; v = Number((v + step).toFixed(decimals))) {
    result.push({ value: v })
  }
  return result
}

const isRangeValue = (value: unknown): value is [number, number] =>
  Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number'

/** Stores props for each Slider ref so the constructed handler can access them without re-renders */
const sliderPropsMap = new WeakMap<object, SliderProps>()

/**
 * Directly updates DOM positions and aria-valuenow on thumb/track elements.
 * Used during drag for smooth updates without triggering a full re-render.
 */
const syncVisuals = (
  track: HTMLElement | null,
  thumb0: HTMLElement | null,
  thumb1: HTMLElement | null,
  value: number | [number, number],
  min: number,
  max: number,
  vertical: boolean,
): void => {
  const thumbs = [thumb0, thumb1].filter(Boolean) as HTMLElement[]

  if (isRangeValue(value)) {
    const startPct = valueToPercent(value[0], min, max)
    const endPct = valueToPercent(value[1], min, max)

    if (track) {
      if (vertical) {
        track.style.bottom = `${startPct}%`
        track.style.height = `${endPct - startPct}%`
        track.style.left = ''
        track.style.width = ''
      } else {
        track.style.left = `${startPct}%`
        track.style.width = `${endPct - startPct}%`
        track.style.bottom = ''
        track.style.height = ''
      }
    }

    thumbs.forEach((thumb, i) => {
      const pct = i === 0 ? startPct : endPct
      if (vertical) {
        thumb.style.bottom = `${pct}%`
        thumb.style.left = ''
      } else {
        thumb.style.left = `${pct}%`
        thumb.style.bottom = ''
      }
      thumb.setAttribute('aria-valuenow', String(value[i]))
    })
  } else {
    const pct = valueToPercent(value, min, max)

    if (track) {
      if (vertical) {
        track.style.bottom = '0%'
        track.style.height = `${pct}%`
        track.style.left = ''
        track.style.width = ''
      } else {
        track.style.left = '0%'
        track.style.width = `${pct}%`
        track.style.bottom = ''
        track.style.height = ''
      }
    }

    if (thumbs[0]) {
      if (vertical) {
        thumbs[0].style.bottom = `${pct}%`
        thumbs[0].style.left = ''
      } else {
        thumbs[0].style.left = `${pct}%`
        thumbs[0].style.bottom = ''
      }
      thumbs[0].setAttribute('aria-valuenow', String(value))
    }
  }
}

/**
 * Sets all ARIA attributes on thumb elements after render.
 */
const syncAriaAttributes = (
  thumb0: HTMLElement | null,
  thumb1: HTMLElement | null,
  value: number | [number, number],
  min: number,
  max: number,
  vertical: boolean,
  disabled: boolean,
): void => {
  const thumbs = [thumb0, thumb1].filter(Boolean) as HTMLElement[]
  thumbs.forEach((thumb, i) => {
    thumb.setAttribute('role', 'slider')
    thumb.setAttribute('aria-valuemin', String(min))
    thumb.setAttribute('aria-valuemax', String(max))
    thumb.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal')
    if (disabled) {
      thumb.setAttribute('aria-disabled', 'true')
    } else {
      thumb.removeAttribute('aria-disabled')
    }
    if (isRangeValue(value)) {
      thumb.setAttribute('aria-valuenow', String(value[i]))
    } else {
      thumb.setAttribute('aria-valuenow', String(value))
    }
  })
}

export const Slider = Shade<SliderProps>({
  shadowDomName: 'shade-slider',
  css: {
    display: 'block',
    position: 'relative',
    width: '100%',
    padding: '10px',
    cursor: 'pointer',
    userSelect: 'none',
    webkitUserSelect: 'none',
    touchAction: 'none',

    '&[data-vertical]': {
      display: 'inline-flex',
      width: 'auto',
      height: '200px',
    },

    '&[data-disabled]': {
      cursor: 'default',
      opacity: cssVariableTheme.action.disabledOpacity,
      pointerEvents: 'none',
    },

    '&[data-has-labels]': {
      paddingBottom: '28px',
    },

    '&[data-vertical][data-has-labels]': {
      paddingBottom: '10px',
      paddingRight: '40px',
    },

    '& .slider-root': {
      position: 'relative',
      width: '100%',
      height: '4px',
    },

    '&[data-vertical] .slider-root': {
      width: '4px',
      height: '100%',
    },

    '& .slider-rail': {
      position: 'absolute',
      inset: '0',
      borderRadius: cssVariableTheme.shape.borderRadius.xs,
      backgroundColor: 'color-mix(in srgb, var(--slider-color) 30%, transparent)',
    },

    '& .slider-track': {
      position: 'absolute',
      height: '100%',
      borderRadius: cssVariableTheme.shape.borderRadius.xs,
      backgroundColor: 'var(--slider-color)',
      transition: buildTransition(
        ['left', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['width', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '&[data-vertical] .slider-track': {
      width: '100%',
      height: 'auto',
      transition: buildTransition(
        ['bottom', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['height', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '&[data-dragging] .slider-track': {
      transition: 'none',
    },

    '& .slider-thumb': {
      position: 'absolute',
      width: '20px',
      height: '20px',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      backgroundColor: 'var(--slider-color)',
      boxShadow: cssVariableTheme.shadows.sm,
      top: '50%',
      transform: 'translate(-50%, -50%)',
      outline: 'none',
      cursor: 'grab',
      zIndex: '1',
      transition: buildTransition(
        ['left', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '&[data-vertical] .slider-thumb': {
      top: 'auto',
      left: '50%',
      transform: 'translate(-50%, 50%)',
      transition: buildTransition(
        ['bottom', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '&[data-dragging] .slider-thumb': {
      cursor: 'grabbing',
      transition: 'none',
    },

    '& .slider-thumb:hover': {
      boxShadow: '0 0 0 8px color-mix(in srgb, var(--slider-color) 16%, transparent)',
    },

    '& .slider-thumb:focus-visible': {
      boxShadow: '0 0 0 4px color-mix(in srgb, var(--slider-color) 30%, transparent)',
    },

    '& .slider-mark-dot': {
      position: 'absolute',
      width: '4px',
      height: '4px',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      top: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'color-mix(in srgb, var(--slider-color) 50%, white)',
    },

    '& .slider-mark-dot[data-active]': {
      backgroundColor: 'var(--slider-color)',
    },

    '&[data-vertical] .slider-mark-dot': {
      top: 'auto',
      left: '50%',
      transform: 'translate(-50%, 50%)',
    },

    '& .slider-mark-label': {
      position: 'absolute',
      top: '14px',
      transform: 'translateX(-50%)',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      color: cssVariableTheme.text.secondary,
      whiteSpace: 'nowrap',
    },

    '&[data-vertical] .slider-mark-label': {
      top: 'auto',
      left: cssVariableTheme.spacing.md,
      transform: 'translateY(50%)',
    },
  },

  render: ({ props, injector, useDisposable, useHostProps, useRef }) => {
    const sliderRootRef = useRef<HTMLDivElement>('sliderRoot')
    const trackRef = useRef<HTMLElement>('sliderTrack')
    const thumb0Ref = useRef<HTMLElement>('sliderThumb0')
    const thumb1Ref = useRef<HTMLElement>('sliderThumb1')

    useDisposable('interaction-handler', () => {
      let isDragging = false
      let activeThumbIdx = 0
      let cleanupDrag: (() => void) | null = null
      // Pending value tracked during drag to avoid triggering re-renders mid-interaction.
      // Shades recreates custom elements on parent re-render, which would orphan our
      // document-level drag listeners and cause stale getBoundingClientRect calculations.
      let pendingValue: number | [number, number] | null = null

      const getProps = (): SliderProps & { min: number; max: number; step: number } => {
        const p = sliderPropsMap.get(sliderRootRef)
        return {
          ...p,
          min: p?.min ?? 0,
          max: p?.max ?? 100,
          step: p?.step ?? 1,
        }
      }

      const getValueFromPointer = (clientX: number, clientY: number): number | null => {
        if (!sliderRootRef.current?.isConnected) return null
        const root = sliderRootRef.current
        if (!root) return null
        const rect = root.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return null
        const { min, max, step, vertical } = getProps()
        let pct: number
        if (vertical) {
          pct = rect.height > 0 ? ((rect.bottom - clientY) / rect.height) * 100 : 0
        } else {
          pct = rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0
        }
        pct = clamp(pct, 0, 100)
        return snapToStep(percentToValue(pct, min, max), step, min, max)
      }

      const applyVisual = (newValue: number | [number, number]): void => {
        const { min, max, vertical } = getProps()
        syncVisuals(trackRef.current, thumb0Ref.current, thumb1Ref.current, newValue, min, max, vertical ?? false)
      }

      const emitToParent = (newValue: number | [number, number]): void => {
        getProps().onValueChange?.(newValue)
      }

      const getCurrentValue = (): number | [number, number] => {
        if (pendingValue !== null) return pendingValue
        const currentProps = getProps()
        return currentProps.value ?? currentProps.min
      }

      const handlePointerDown = (e: MouseEvent | TouchEvent): void => {
        const currentProps = getProps()
        if (currentProps.disabled) return

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        const target = e.target as HTMLElement
        const isThumb = target.classList.contains('slider-thumb')

        if (isThumb) {
          activeThumbIdx = Number(target.dataset.index ?? 0)
          pendingValue = getCurrentValue()
        } else {
          const newVal = getValueFromPointer(clientX, clientY)
          if (newVal === null) return
          const currentValue = currentProps.value ?? currentProps.min

          if (isRangeValue(currentValue)) {
            const distStart = Math.abs(newVal - currentValue[0])
            const distEnd = Math.abs(newVal - currentValue[1])
            activeThumbIdx = distStart <= distEnd ? 0 : 1
            const updated: [number, number] = [currentValue[0], currentValue[1]]
            updated[activeThumbIdx] = newVal
            if (updated[0] > updated[1]) {
              activeThumbIdx = activeThumbIdx === 0 ? 1 : 0
              ;[updated[0], updated[1]] = [updated[1], updated[0]]
            }
            pendingValue = updated
          } else {
            activeThumbIdx = 0
            pendingValue = newVal
          }
          applyVisual(pendingValue)
        }

        isDragging = true
        sliderRootRef.current?.setAttribute('data-dragging', '')

        const handlePointerMove = (moveEvt: MouseEvent | TouchEvent): void => {
          if (!isDragging || !sliderRootRef.current?.isConnected) {
            endDrag()
            return
          }
          moveEvt.preventDefault()

          const mx = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX
          const my = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY
          const newVal = getValueFromPointer(mx, my)
          if (newVal === null) return
          const currentValue = getCurrentValue()

          if (isRangeValue(currentValue)) {
            const updated: [number, number] = [currentValue[0], currentValue[1]]
            updated[activeThumbIdx] = newVal
            if (updated[0] > updated[1]) {
              activeThumbIdx = activeThumbIdx === 0 ? 1 : 0
              ;[updated[0], updated[1]] = [updated[1], updated[0]]
            }
            pendingValue = updated
          } else {
            pendingValue = newVal
          }
          applyVisual(pendingValue)
        }

        const endDrag = (): void => {
          isDragging = false
          sliderRootRef.current?.removeAttribute('data-dragging')
          document.removeEventListener('mousemove', handlePointerMove)
          document.removeEventListener('mouseup', endDrag)
          document.removeEventListener('touchmove', handlePointerMove)
          document.removeEventListener('touchend', endDrag)
          cleanupDrag = null
          if (pendingValue !== null) {
            const value = pendingValue
            pendingValue = null
            emitToParent(value)
          }
        }

        document.addEventListener('mousemove', handlePointerMove)
        document.addEventListener('mouseup', endDrag)
        document.addEventListener('touchmove', handlePointerMove, { passive: false })
        document.addEventListener('touchend', endDrag)
        cleanupDrag = endDrag
        e.preventDefault()
      }

      const handleKeyDown = (e: KeyboardEvent): void => {
        const currentProps = getProps()
        if (currentProps.disabled) return

        const target = e.target as HTMLElement
        if (!target.classList.contains('slider-thumb')) return

        const thumbIdx = Number(target.dataset.index ?? 0)
        const { step, min, max } = currentProps
        const currentValue = getCurrentValue()

        let val: number
        if (isRangeValue(currentValue)) {
          val = currentValue[thumbIdx]
        } else {
          val = currentValue
        }

        const effectiveStep = step <= 0 ? 1 : step
        const bigStep = effectiveStep * 10
        let newVal: number

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            newVal = snapToStep(val + effectiveStep, step, min, max)
            break
          case 'ArrowLeft':
          case 'ArrowDown':
            newVal = snapToStep(val - effectiveStep, step, min, max)
            break
          case 'PageUp':
            newVal = snapToStep(val + bigStep, step, min, max)
            break
          case 'PageDown':
            newVal = snapToStep(val - bigStep, step, min, max)
            break
          case 'Home':
            newVal = min
            break
          case 'End':
            newVal = max
            break
          default:
            return
        }

        e.preventDefault()

        let updated: number | [number, number]
        if (isRangeValue(currentValue)) {
          const pair: [number, number] = [currentValue[0], currentValue[1]]
          pair[thumbIdx] = newVal
          if (thumbIdx === 0 && pair[0] > pair[1]) pair[0] = pair[1]
          if (thumbIdx === 1 && pair[1] < pair[0]) pair[1] = pair[0]
          updated = pair
        } else {
          updated = newVal
        }
        applyVisual(updated)
        emitToParent(updated)
      }

      let root: HTMLElement | null = null
      queueMicrotask(() => {
        root = sliderRootRef.current
        root?.addEventListener('mousedown', handlePointerDown)
        root?.addEventListener('touchstart', handlePointerDown, { passive: false })
        root?.addEventListener('keydown', handleKeyDown)
      })

      return {
        [Symbol.dispose]: () => {
          root?.removeEventListener('mousedown', handlePointerDown)
          root?.removeEventListener('touchstart', handlePointerDown)
          root?.removeEventListener('keydown', handleKeyDown)
          cleanupDrag?.()
        },
      }
    })

    const themeProvider = injector.getInstance(ThemeProviderService)
    const min = props.min ?? 0
    const max = props.max ?? 100
    const step = props.step ?? 1
    const value = props.value ?? min
    const vertical = props.vertical ?? false
    const disabled = props.disabled ?? false
    const rangeMode = isRangeValue(value)

    // Store props for interaction event handlers
    sliderPropsMap.set(sliderRootRef, props)

    // Theme color
    const color = themeProvider.theme.palette[props.color || 'primary'].main

    // Resolve marks
    const marks = resolveMarks(props.marks, min, max, step)
    const hasLabels = marks.some((m) => m.label)

    useHostProps({
      style: { '--slider-color': color },
      ...(vertical ? { 'data-vertical': '' } : {}),
      ...(disabled ? { 'data-disabled': '' } : {}),
      ...(hasLabels ? { 'data-has-labels': '' } : {}),
    })

    // Set ARIA attributes on thumbs after render
    queueMicrotask(() => {
      syncAriaAttributes(thumb0Ref.current, thumb1Ref.current, value, min, max, vertical, disabled)
    })

    // Calculate positions
    const renderMarks = (activeCheck: (markValue: number) => boolean) =>
      marks.map((mark) => {
        const pct = valueToPercent(mark.value, min, max)
        const isActive = activeCheck(mark.value)
        const pos: Partial<CSSStyleDeclaration> = vertical ? { bottom: `${pct}%` } : { left: `${pct}%` }
        return (
          <>
            <span className="slider-mark-dot" {...(isActive ? { 'data-active': '' } : {})} style={pos} />
            {mark.label ? (
              <span className="slider-mark-label" style={pos}>
                {mark.label}
              </span>
            ) : null}
          </>
        )
      })

    if (rangeMode) {
      const startPct = valueToPercent(value[0], min, max)
      const endPct = valueToPercent(value[1], min, max)

      const trackStyle: Partial<CSSStyleDeclaration> = vertical
        ? { bottom: `${startPct}%`, height: `${endPct - startPct}%` }
        : { left: `${startPct}%`, width: `${endPct - startPct}%` }

      const thumbStartStyle: Partial<CSSStyleDeclaration> = vertical
        ? { bottom: `${startPct}%` }
        : { left: `${startPct}%` }

      const thumbEndStyle: Partial<CSSStyleDeclaration> = vertical ? { bottom: `${endPct}%` } : { left: `${endPct}%` }

      return (
        <div ref={sliderRootRef} className="slider-root">
          <div className="slider-rail" />
          <div ref={trackRef} className="slider-track" style={trackStyle} />
          <div
            ref={thumb0Ref}
            className="slider-thumb"
            data-index="0"
            tabIndex={disabled ? -1 : 0}
            style={thumbStartStyle}
          />
          <div
            ref={thumb1Ref}
            className="slider-thumb"
            data-index="1"
            tabIndex={disabled ? -1 : 0}
            style={thumbEndStyle}
          />
          {renderMarks((v) => v >= value[0] && v <= value[1])}
        </div>
      )
    }

    // Single slider
    const pct = valueToPercent(value, min, max)

    const trackStyle: Partial<CSSStyleDeclaration> = vertical
      ? { bottom: '0%', height: `${pct}%` }
      : { left: '0%', width: `${pct}%` }

    const thumbStyle: Partial<CSSStyleDeclaration> = vertical ? { bottom: `${pct}%` } : { left: `${pct}%` }

    return (
      <div ref={sliderRootRef} className="slider-root">
        <div className="slider-rail" />
        <div ref={trackRef} className="slider-track" style={trackStyle} />
        <div ref={thumb0Ref} className="slider-thumb" data-index="0" tabIndex={disabled ? -1 : 0} style={thumbStyle} />
        {renderMarks((v) => v <= value)}
        {props.name ? <input type="hidden" name={props.name} value={String(value)} /> : null}
      </div>
    )
  },
})
