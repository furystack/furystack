import { Shade, createComponent } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import type { Palette } from '../services/theme-provider-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'

export type CircularProgressProps = {
  /**
   * An observable progress value (0–100). Used when variant is 'determinate'.
   * The component subscribes internally and updates the arc without re-rendering.
   */
  value?: ObservableValue<number>
  /**
   * The variant of the progress indicator.
   * - 'determinate': shows a fixed arc based on `value`
   * - 'indeterminate': shows a rotating animation
   * @default 'indeterminate'
   */
  variant?: 'determinate' | 'indeterminate'
  /**
   * The palette color for the progress circle.
   * @default 'primary'
   */
  color?: keyof Palette
  /**
   * The diameter of the circular progress in pixels.
   * @default 40
   */
  size?: number
  /**
   * The thickness of the circular stroke.
   * @default 3.6
   */
  thickness?: number
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const SVG_SIZE = 44
const DEFAULT_SIZE = 40
const DEFAULT_THICKNESS = 3.6

const clampValue = (v: number) => Math.max(0, Math.min(100, v))

const setCircularColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: CircularProgressProps
}): void => {
  const color = themeProvider.theme.palette[props.color || 'primary'].main
  element.style.setProperty('--circular-progress-color', color)
}

const updateDeterminate = (element: HTMLElement, circumference: number, value: number): void => {
  const clamped = clampValue(value)
  const circle = element.querySelector<SVGCircleElement>('.progress-circle')
  if (circle) {
    const dashOffset = circumference - (clamped / 100) * circumference
    circle.style.strokeDashoffset = `${dashOffset}`
  }
  element.setAttribute('aria-valuenow', String(clamped))
}

const createSvgContent = ({
  size,
  thickness,
  circumference,
  dashOffset,
  indeterminate,
}: {
  size: number
  thickness: number
  circumference: number
  dashOffset: number
  indeterminate: boolean
}): SVGSVGElement => {
  const radius = (SVG_SIZE - thickness) / 2
  const center = String(SVG_SIZE / 2)

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('viewBox', `0 0 ${SVG_SIZE} ${SVG_SIZE}`)

  const track = document.createElementNS(SVG_NS, 'circle')
  track.setAttribute('class', 'progress-track')
  track.setAttribute('cx', center)
  track.setAttribute('cy', center)
  track.setAttribute('r', String(radius))
  track.setAttribute('stroke-width', String(thickness))

  const circle = document.createElementNS(SVG_NS, 'circle')
  circle.setAttribute('class', 'progress-circle')
  circle.setAttribute('cx', center)
  circle.setAttribute('cy', center)
  circle.setAttribute('r', String(radius))
  circle.setAttribute('stroke-width', String(thickness))
  circle.setAttribute(
    'stroke-dasharray',
    indeterminate ? `${circumference * 0.05} ${circumference}` : `${circumference}`,
  )
  circle.style.strokeDashoffset = `${dashOffset}`
  circle.setAttribute('transform', `rotate(-90 ${SVG_SIZE / 2} ${SVG_SIZE / 2})`)

  svg.appendChild(track)
  svg.appendChild(circle)

  if (indeterminate) {
    const style = document.createElementNS(SVG_NS, 'style')
    style.textContent = `
      @keyframes circular-rotate {
        100% { transform: rotate(360deg); }
      }
      @keyframes circular-dash {
        0% {
          stroke-dasharray: ${circumference * 0.05} ${circumference};
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: ${circumference * 0.7} ${circumference};
          stroke-dashoffset: ${-circumference * 0.12};
        }
        100% {
          stroke-dasharray: ${circumference * 0.7} ${circumference};
          stroke-dashoffset: ${-circumference * 0.88};
        }
      }
    `
    svg.insertBefore(style, track)

    svg.style.animation = 'circular-rotate 1.4s linear infinite'
    circle.style.animation = 'circular-dash 1.4s ease-in-out infinite'
  }

  return svg
}

export const CircularProgress = Shade<CircularProgressProps>({
  shadowDomName: 'shade-circular-progress',
  css: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',

    '& svg': {
      display: 'block',
    },

    '& .progress-track': {
      stroke: 'color-mix(in srgb, var(--circular-progress-color) 20%, transparent)',
      fill: 'none',
    },

    '& .progress-circle': {
      stroke: 'var(--circular-progress-color)',
      fill: 'none',
      strokeLinecap: 'round',
      transition: `stroke-dashoffset ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.easeInOut}`,
    },
  },
  constructed: ({ props, element }) => {
    const variant = props.variant || 'indeterminate'
    const thickness = props.thickness ?? DEFAULT_THICKNESS
    if (variant === 'determinate' && props.value) {
      const radius = (SVG_SIZE - thickness) / 2
      const circumference = 2 * Math.PI * radius
      const subscription = props.value.subscribe((next) => updateDeterminate(element, circumference, next))
      return () => subscription[Symbol.dispose]()
    }
  },
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const variant = props.variant || 'indeterminate'
    const value = clampValue(props.value?.getValue() ?? 0)
    const size = props.size ?? DEFAULT_SIZE
    const thickness = props.thickness ?? DEFAULT_THICKNESS

    element.setAttribute('role', 'progressbar')
    if (variant === 'determinate') {
      element.setAttribute('aria-valuenow', String(value))
      element.setAttribute('aria-valuemin', '0')
      element.setAttribute('aria-valuemax', '100')
    } else {
      element.removeAttribute('aria-valuenow')
    }

    setCircularColors({ element, themeProvider, props })

    const radius = (SVG_SIZE - thickness) / 2
    const circumference = 2 * Math.PI * radius

    const dashOffset = variant === 'determinate' ? circumference - (value / 100) * circumference : 0

    const svg = createSvgContent({
      size,
      thickness,
      circumference,
      dashOffset,
      indeterminate: variant === 'indeterminate',
    })

    const wrapper = (<span className="circular-progress-container" />) as unknown as HTMLElement
    wrapper.appendChild(svg)

    return wrapper as unknown as JSX.Element
  },
})
