import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { paletteMainColors } from '../../services/palette-css-vars.js'
import type { Palette } from '../../services/theme-provider-service.js'
import type { IconDefinition } from './icon-types.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

const SIZE_MAP: Record<string, number> = {
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

const createSvg = (icon: IconDefinition, sizePx: number): SVGSVGElement => {
  const viewBox = icon.viewBox ?? '0 0 24 24'
  const isStroke = (icon.style ?? 'stroke') === 'stroke'

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', String(sizePx))
  svg.setAttribute('height', String(sizePx))
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('xmlns', SVG_NS)

  if (isStroke) {
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', String(icon.strokeWidth ?? 2))
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
  } else {
    svg.setAttribute('fill', 'currentColor')
    svg.setAttribute('stroke', 'none')
  }

  for (const pathDef of icon.paths) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', pathDef.d)
    if (pathDef.fillRule) {
      path.setAttribute('fill-rule', pathDef.fillRule)
    }
    svg.appendChild(path)
  }

  return svg
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
  render: ({ props, element }) => {
    const { icon, size = 'medium', color, ariaLabel, style } = props

    const sizeName = typeof size === 'string' ? size : undefined
    const sizePx = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 24)

    if (sizeName) {
      element.setAttribute('data-size', sizeName)
    } else {
      element.removeAttribute('data-size')
      element.style.width = `${sizePx}px`
      element.style.height = `${sizePx}px`
    }

    if (color) {
      const colors = paletteMainColors[color]
      element.style.setProperty('--icon-color', colors.main)
    } else {
      element.style.removeProperty('--icon-color')
    }

    element.setAttribute('role', 'img')
    if (ariaLabel) {
      element.setAttribute('aria-label', ariaLabel)
      element.removeAttribute('aria-hidden')
    } else {
      element.removeAttribute('aria-label')
      element.setAttribute('aria-hidden', 'true')
    }

    if (style) {
      Object.assign(element.style, style)
    }

    const svg = createSvg(icon, sizePx)
    const wrapper = (<span className="icon-container" />) as unknown as HTMLElement
    wrapper.appendChild(svg)

    return wrapper as unknown as JSX.Element
  },
})
