import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { paletteMainColors } from '../../services/palette-css-vars.js'
import type { Palette } from '../../services/theme-provider-service.js'
import type { IconDefinition } from './icon-types.js'

const SIZE_MAP: Record<'small' | 'medium' | 'large', number> = {
  small: 16,
  medium: 24,
  large: 32,
}

export type IconProps = PartialElement<HTMLElement> & {
  /** The icon definition to render */
  icon: IconDefinition
  /**
   * The size of the icon.
   * - `'small'`: 16px
   * - `'medium'`: 24px
   * - `'large'`: 32px
   * - `number`: custom size in pixels
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | number
  /**
   * The palette color for the icon.
   * When not provided, the icon uses `currentColor` (inherits from parent text color).
   */
  color?: keyof Palette
  /**
   * Accessible label for the icon.
   * When provided, sets `aria-label` on the element.
   * When omitted, sets `aria-hidden="true"` to hide the decorative icon from assistive technologies.
   */
  ariaLabel?: string
}

export const Icon = Shade<IconProps>({
  shadowDomName: 'shade-icon',
  css: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    lineHeight: '1',
    flexShrink: '0',
    color: 'var(--icon-color, currentColor)',

    '& svg': {
      display: 'block',
    },

    '&[data-size="small"]': {
      width: '16px',
      height: '16px',
    },
    '&[data-size="medium"]': {
      width: '24px',
      height: '24px',
    },
    '&[data-size="large"]': {
      width: '32px',
      height: '32px',
    },
  },
  render: ({ props, useHostProps }) => {
    const { icon, size = 'medium', color, ariaLabel, style } = props

    const sizeName = typeof size === 'string' ? size : undefined
    const sizePx = typeof size === 'number' ? size : SIZE_MAP[size]

    const hostStyle: Record<string, string> = {}
    if (!sizeName) {
      hostStyle.width = `${sizePx}px`
      hostStyle.height = `${sizePx}px`
    }
    if (color) {
      hostStyle['--icon-color'] = paletteMainColors[color].main
    }
    if (style) {
      Object.assign(hostStyle, style)
    }
    useHostProps({
      'data-size': sizeName || undefined,
      role: 'img',
      'aria-label': ariaLabel || undefined,
      'aria-hidden': ariaLabel ? undefined : 'true',
      style: hostStyle,
    })

    const viewBox = icon.viewBox ?? '0 0 24 24'
    const isStroke = (icon.style ?? 'stroke') === 'stroke'

    return (
      <svg
        width={sizePx}
        height={sizePx}
        viewBox={viewBox}
        fill={isStroke ? 'none' : 'currentColor'}
        stroke={isStroke ? 'currentColor' : 'none'}
        stroke-width={isStroke ? (icon.strokeWidth ?? 2) : undefined}
        stroke-linecap={isStroke ? 'round' : undefined}
        stroke-linejoin={isStroke ? 'round' : undefined}
      >
        {icon.paths.map((p) => (
          <path d={p.d} fill-rule={p.fillRule} />
        ))}
      </svg>
    )
  },
})
