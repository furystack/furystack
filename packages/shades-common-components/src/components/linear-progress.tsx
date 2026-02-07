import { Shade, createComponent } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import type { Palette } from '../services/theme-provider-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'

export type LinearProgressProps = {
  /**
   * An observable progress value (0–100). Used when variant is 'determinate'.
   * The component subscribes internally and updates the bar without re-rendering.
   */
  value?: ObservableValue<number>
  /**
   * The variant of the progress indicator.
   * - 'determinate': shows a fixed progress bar based on `value`
   * - 'indeterminate': shows an animated looping bar
   * @default 'indeterminate'
   */
  variant?: 'determinate' | 'indeterminate'
  /**
   * The palette color for the progress bar.
   * @default 'primary'
   */
  color?: keyof Palette
  /**
   * The height of the progress bar.
   * @default 'medium'
   */
  size?: 'small' | 'medium'
}

const clampValue = (v: number) => Math.max(0, Math.min(100, v))

const setProgressColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: LinearProgressProps
}): void => {
  const color = themeProvider.theme.palette[props.color || 'primary'].main
  element.style.setProperty('--progress-color', color)
}

const updateDeterminate = (element: HTMLElement, value: number): void => {
  const clamped = clampValue(value)
  const bar = element.querySelector<HTMLElement>('.progress-bar')
  if (bar) {
    bar.style.width = `${clamped}%`
  }
  element.setAttribute('aria-valuenow', String(clamped))
}

export const LinearProgress = Shade<LinearProgressProps>({
  shadowDomName: 'shade-linear-progress',
  css: {
    display: 'block',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: cssVariableTheme.shape.borderRadius.xs,
    backgroundColor: 'color-mix(in srgb, var(--progress-color) 20%, transparent)',

    // Medium size (default)
    height: '6px',

    '&[data-size="small"]': {
      height: '4px',
    },

    '& .progress-bar': {
      position: 'absolute',
      top: '0',
      left: '0',
      height: '100%',
      borderRadius: 'inherit',
      backgroundColor: 'var(--progress-color)',
      transition: buildTransition([
        'width',
        cssVariableTheme.transitions.duration.normal,
        cssVariableTheme.transitions.easing.easeInOut,
      ]),
    },

    '& .progress-bar[data-indeterminate]': {
      transition: 'none',
    },
  },
  constructed: ({ props, element }) => {
    const variant = props.variant || 'indeterminate'
    if (variant === 'determinate' && props.value) {
      const subscription = props.value.subscribe((next) => updateDeterminate(element, next))
      return () => subscription[Symbol.dispose]()
    }
  },
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const variant = props.variant || 'indeterminate'
    const value = clampValue(props.value?.getValue() ?? 0)

    if (props.size === 'small') {
      element.setAttribute('data-size', 'small')
    } else {
      element.removeAttribute('data-size')
    }

    element.setAttribute('role', 'progressbar')
    if (variant === 'determinate') {
      element.setAttribute('aria-valuenow', String(value))
      element.setAttribute('aria-valuemin', '0')
      element.setAttribute('aria-valuemax', '100')
    } else {
      element.removeAttribute('aria-valuenow')
    }

    setProgressColors({ element, themeProvider, props })

    const barWidth = variant === 'determinate' ? `${value}%` : '40%'

    if (variant === 'indeterminate') {
      setTimeout(() => {
        const bar = element.querySelector<HTMLElement>('.progress-bar')
        if (bar) {
          void promisifyAnimation(
            bar,
            [
              { left: '-40%', width: '40%' },
              { left: '60%', width: '40%' },
              { left: '100%', width: '10%' },
            ],
            {
              duration: 1800,
              easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
              iterations: Infinity,
            },
          )
        }
      }, 1)
    }

    return (
      <div
        className="progress-bar"
        style={{ width: barWidth }}
        {...(variant === 'indeterminate' ? { 'data-indeterminate': '' } : {})}
      />
    )
  },
})
