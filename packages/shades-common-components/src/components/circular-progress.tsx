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
  render: ({ props, injector, useDisposable, useHostProps, useRef }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const circleRef = useRef<SVGCircleElement>('progressCircle')
    const variant = props.variant || 'indeterminate'
    const value = clampValue(props.value?.getValue() ?? 0)
    const size = props.size ?? DEFAULT_SIZE
    const thickness = props.thickness ?? DEFAULT_THICKNESS
    const indeterminate = variant === 'indeterminate'

    const radius = (SVG_SIZE - thickness) / 2
    const circumference = 2 * Math.PI * radius

    if (variant === 'determinate' && props.value) {
      useDisposable('value-subscription', () =>
        props.value!.subscribe((next) => {
          const clamped = Math.max(0, Math.min(100, next))
          if (circleRef.current) {
            const dashOffset = circumference - (clamped / 100) * circumference
            circleRef.current.style.strokeDashoffset = `${dashOffset}`
          }
        }),
      )
    }

    const color = themeProvider.theme.palette[props.color || 'primary'].main
    useHostProps({
      role: 'progressbar',
      ...(variant === 'determinate'
        ? {
            'aria-valuenow': String(value),
            'aria-valuemin': '0',
            'aria-valuemax': '100',
          }
        : {
            'aria-valuenow': undefined,
          }),
      style: { '--circular-progress-color': color },
    })

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
          ref={circleRef}
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
