import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import type { Palette } from '../services/theme-provider-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { Icon } from './icons/icon.js'
import { star as starIcon, starOutline } from './icons/icon-definitions.js'

/**
 * Props for the Rating component
 */
export type RatingProps = {
  /**
   * Current rating value
   */
  value?: number
  /**
   * Maximum number of stars (default: 5)
   */
  max?: number
  /**
   * Rating precision - 1 for full stars, 0.5 for half stars (default: 1)
   */
  precision?: 1 | 0.5
  /**
   * Size of the rating stars
   */
  size?: 'small' | 'medium' | 'large'
  /**
   * Whether the rating is disabled
   */
  disabled?: boolean
  /**
   * Whether the rating is read-only (displays value but not interactive)
   */
  readOnly?: boolean
  /**
   * Theme palette color (default: 'warning' for gold stars)
   */
  color?: keyof Palette
  /**
   * Content used for filled stars (default: filled star icon)
   */
  icon?: JSX.Element | string
  /**
   * Content used for empty stars (default: outlined star icon)
   */
  emptyIcon?: JSX.Element | string
  /**
   * Callback when the rating value changes
   * @param value - The new rating value
   */
  onValueChange?: (value: number) => void
  /**
   * The name attribute for the hidden input element (for form integration)
   */
  name?: string
}

/**
 * Rating component for collecting user feedback with star ratings.
 * Supports full and half-star precision, custom icons, hover feedback,
 * keyboard navigation, and theme integration.
 */
export const Rating = Shade<RatingProps>({
  shadowDomName: 'shade-rating',
  css: {
    display: 'inline-flex',
    alignItems: 'center',

    '& .rating-container': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
    },

    '& .rating-star': {
      position: 'relative',
      display: 'inline-flex',
      cursor: 'pointer',
      fontSize: cssVariableTheme.typography.fontSize.xl,
      lineHeight: '1',
      userSelect: 'none',
      webkitUserSelect: 'none',
      transition: buildTransition([
        'transform',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },

    '& .star-empty': {
      color: cssVariableTheme.text.disabled,
    },

    '& .star-filled': {
      position: 'absolute',
      top: '0',
      left: '0',
      color: 'var(--rating-color)',
      overflow: 'hidden',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      transition: buildTransition([
        'width',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },

    '&:not([data-disabled]):not([data-readonly]) .rating-star:hover': {
      transform: 'scale(1.15)',
    },

    '&:focus-visible': {
      outline: 'none',
      boxShadow: cssVariableTheme.action.focusRing,
      borderRadius: cssVariableTheme.shape.borderRadius.xs,
    },

    '&[data-size="small"] .rating-star': {
      fontSize: '18px',
    },

    '&[data-size="large"] .rating-star': {
      fontSize: '32px',
    },

    '&[data-disabled] .rating-star': {
      cursor: 'not-allowed',
      opacity: cssVariableTheme.action.disabledOpacity,
    },

    '&[data-disabled] .rating-star:hover': {
      transform: 'none',
    },

    '&[data-readonly] .rating-star': {
      cursor: 'default',
    },

    '&[data-readonly] .rating-star:hover': {
      transform: 'none',
    },
  },
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const max = props.max ?? 5
    const precision = props.precision ?? 1
    const value = props.value ?? 0
    const filledIcon = props.icon ?? ((<Icon icon={starIcon} size="small" />) as unknown as JSX.Element)
    const emptyIcon = props.emptyIcon ?? ((<Icon icon={starOutline} size="small" />) as unknown as JSX.Element)
    const isInteractive = !props.disabled && !props.readOnly

    const color = themeProvider.theme.palette[props.color || 'warning'].main
    element.style.setProperty('--rating-color', color)

    if (props.disabled) {
      element.setAttribute('data-disabled', '')
      element.setAttribute('aria-disabled', 'true')
    } else {
      element.removeAttribute('data-disabled')
      element.removeAttribute('aria-disabled')
    }

    if (props.readOnly) {
      element.setAttribute('data-readonly', '')
      element.setAttribute('aria-readonly', 'true')
    } else {
      element.removeAttribute('data-readonly')
      element.removeAttribute('aria-readonly')
    }

    element.setAttribute('data-size', props.size || 'medium')

    if (isInteractive) {
      element.setAttribute('role', 'slider')
      element.setAttribute('tabindex', '0')
      element.setAttribute('aria-valuenow', String(value))
      element.setAttribute('aria-valuemin', '0')
      element.setAttribute('aria-valuemax', String(max))
      element.setAttribute('aria-label', 'Rating')
    } else {
      element.setAttribute('role', 'img')
      element.removeAttribute('tabindex')
      element.setAttribute('aria-label', `Rating: ${value} out of ${max}`)
    }

    const updateStarVisuals = (displayValue: number) => {
      const starEls = element.querySelectorAll('.rating-star')
      starEls.forEach((starEl, index) => {
        const starValue = index + 1
        const filled = starEl.querySelector('.star-filled') as HTMLElement
        if (!filled) return

        if (displayValue >= starValue) {
          filled.style.width = '100%'
        } else if (precision === 0.5 && displayValue >= starValue - 0.5) {
          filled.style.width = '50%'
        } else {
          filled.style.width = '0%'
        }
      })
    }

    const getValueFromMouseEvent = (ev: MouseEvent, index: number): number => {
      const starEl = ev.currentTarget as HTMLElement
      const rect = starEl.getBoundingClientRect()
      const x = ev.clientX - rect.left
      if (precision === 0.5 && x < rect.width / 2) {
        return index + 0.5
      }
      return index + 1
    }

    const handleClick = (ev: MouseEvent, index: number) => {
      if (!isInteractive) return
      element.focus()
      const newValue = getValueFromMouseEvent(ev, index)
      props.onValueChange?.(newValue)
    }

    const handleMouseMove = (ev: MouseEvent, index: number) => {
      if (!isInteractive) return
      const hoverValue = getValueFromMouseEvent(ev, index)
      updateStarVisuals(hoverValue)
    }

    const handleMouseLeave = () => {
      if (!isInteractive) return
      updateStarVisuals(value)
    }

    element.onkeydown = isInteractive
      ? (ev: KeyboardEvent) => {
          const step = precision === 0.5 ? 0.5 : 1
          let newValue: number

          switch (ev.key) {
            case 'ArrowRight':
            case 'ArrowUp':
              ev.preventDefault()
              newValue = Math.min(value + step, max)
              break
            case 'ArrowLeft':
            case 'ArrowDown':
              ev.preventDefault()
              newValue = Math.max(value - step, 0)
              break
            case 'Home':
              ev.preventDefault()
              newValue = 0
              break
            case 'End':
              ev.preventDefault()
              newValue = max
              break
            default:
              return
          }

          if (newValue !== value) {
            props.onValueChange?.(newValue)
          }
        }
      : null

    const stars = Array.from({ length: max }, (_, i) => {
      const starValue = i + 1
      const isFilled = value >= starValue
      const isHalf = precision === 0.5 && !isFilled && value >= starValue - 0.5
      const initialWidth = isFilled ? '100%' : isHalf ? '50%' : '0%'

      return (
        <span
          className="rating-star"
          aria-hidden="true"
          data-value={String(starValue)}
          onclick={(ev: MouseEvent) => handleClick(ev, i)}
          onmousemove={(ev: MouseEvent) => handleMouseMove(ev, i)}
        >
          <span className="star-empty">{emptyIcon}</span>
          <span className="star-filled" style={{ width: initialWidth }}>
            {filledIcon}
          </span>
        </span>
      )
    })

    return (
      <div className="rating-container" onmouseleave={handleMouseLeave}>
        {stars}
        {props.name ? <input type="hidden" name={props.name} value={String(value)} /> : null}
      </div>
    )
  },
})
