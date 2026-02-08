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
  render: ({ props, injector, element, useDisposable }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const variant = props.variant || 'indeterminate'
    const value = clampValue(props.value?.getValue() ?? 0)
    const size = props.size ?? DEFAULT_SIZE
    const thickness = props.thickness ?? DEFAULT_THICKNESS
    const indeterminate = variant === 'indeterminate'

    const radius = (SVG_SIZE - thickness) / 2
    const circumference = 2 * Math.PI * radius

    if (variant === 'determinate' && props.value) {
      useDisposable('value-subscription', () =>
        props.value!.subscribe((next) => updateDeterminate(element, circumference, next)),
      )
    }

    element.setAttribute('role', 'progressbar')
    if (variant === 'determinate') {
      element.setAttribute('aria-valuenow', String(value))
      element.setAttribute('aria-valuemin', '0')
      element.setAttribute('aria-valuemax', '100')
    } else {
      element.removeAttribute('aria-valuenow')
    }

    setCircularColors({ element, themeProvider, props })

    const dashOffset = variant === 'determinate' ? circumference - (value / 100) * circumference : 0
    const center = SVG_SIZE / 2

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        style={indeterminate ? { animation: 'circular-rotate 1.4s linear infinite' } : undefined}
      >
        {indeterminate && (
          <style>{`
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
          `}</style>
        )}
        <circle className="progress-track" cx={center} cy={center} r={radius} stroke-width={thickness} />
        <circle
          className="progress-circle"
          cx={center}
          cy={center}
          r={radius}
          stroke-width={thickness}
          stroke-dasharray={indeterminate ? `${circumference * 0.05} ${circumference}` : `${circumference}`}
          style={{
            strokeDashoffset: `${dashOffset}`,
            ...(indeterminate ? { animation: 'circular-dash 1.4s ease-in-out infinite' } : {}),
          }}
          transform={`rotate(-90 ${SVG_SIZE / 2} ${SVG_SIZE / 2})`}
        />
      </svg>
    )
  },
})
