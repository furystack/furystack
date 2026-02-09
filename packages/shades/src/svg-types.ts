/**
 * SVG element attribute types for JSX support.
 *
 * Unlike HTML elements where JSX props map to DOM properties, SVG elements
 * use XML attributes set via `setAttribute`. These types describe the
 * attribute-based API rather than the DOM property interfaces.
 */

import type { RefObject } from './models/render-options.js'

/**
 * Common event handlers available on SVG elements.
 */
export type SvgEventHandlers = {
  onclick?: (ev: MouseEvent) => void
  ondblclick?: (ev: MouseEvent) => void
  onmousedown?: (ev: MouseEvent) => void
  onmouseup?: (ev: MouseEvent) => void
  onmousemove?: (ev: MouseEvent) => void
  onmouseenter?: (ev: MouseEvent) => void
  onmouseleave?: (ev: MouseEvent) => void
  onmouseover?: (ev: MouseEvent) => void
  onmouseout?: (ev: MouseEvent) => void
  onfocus?: (ev: FocusEvent) => void
  onblur?: (ev: FocusEvent) => void
  onkeydown?: (ev: KeyboardEvent) => void
  onkeyup?: (ev: KeyboardEvent) => void
  ontouchstart?: (ev: TouchEvent) => void
  ontouchmove?: (ev: TouchEvent) => void
  ontouchend?: (ev: TouchEvent) => void
}

/**
 * SVG presentation attributes shared by most SVG elements.
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/Presentation
 */
export type SvgPresentationAttributes = {
  'clip-path'?: string
  'clip-rule'?: 'nonzero' | 'evenodd'
  color?: string
  cursor?: string
  display?: string
  fill?: string
  'fill-opacity'?: string | number
  'fill-rule'?: 'nonzero' | 'evenodd'
  filter?: string
  'flood-color'?: string
  'flood-opacity'?: string | number
  'font-family'?: string
  'font-size'?: string | number
  'font-style'?: 'normal' | 'italic' | 'oblique'
  'font-weight'?: string | number
  'letter-spacing'?: string | number
  'lighting-color'?: string
  marker?: string
  'marker-end'?: string
  'marker-mid'?: string
  'marker-start'?: string
  mask?: string
  opacity?: string | number
  overflow?: string
  'pointer-events'?: string
  'shape-rendering'?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision'
  'stop-color'?: string
  'stop-opacity'?: string | number
  stroke?: string
  'stroke-dasharray'?: string
  'stroke-dashoffset'?: string | number
  'stroke-linecap'?: 'butt' | 'round' | 'square'
  'stroke-linejoin'?: 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round'
  'stroke-miterlimit'?: string | number
  'stroke-opacity'?: string | number
  'stroke-width'?: string | number
  'text-anchor'?: 'start' | 'middle' | 'end'
  'text-decoration'?: string
  'dominant-baseline'?: string
  'alignment-baseline'?: string
  transform?: string
  'transform-origin'?: string
  visibility?: 'visible' | 'hidden' | 'collapse'
  'word-spacing'?: string | number
}

/**
 * Core attributes available on all SVG elements.
 */
export type SvgCoreAttributes = {
  id?: string
  className?: string
  style?: Partial<CSSStyleDeclaration>
  tabIndex?: number
  ref?: RefObject<Element>
} & SvgPresentationAttributes &
  SvgEventHandlers

// ---------------------------------------------------------------------------
// Element-specific attribute types
// ---------------------------------------------------------------------------

/** Attributes for the `<svg>` element. */
export type SvgSvgAttributes = SvgCoreAttributes & {
  viewBox?: string
  width?: string | number
  height?: string | number
  xmlns?: string
  preserveAspectRatio?: string
  x?: string | number
  y?: string | number
}

/** Attributes for the `<g>` element. */
export type SvgGAttributes = SvgCoreAttributes

/** Attributes for the `<defs>` element. */
export type SvgDefsAttributes = SvgCoreAttributes

/** Attributes for the `<symbol>` element. */
export type SvgSymbolAttributes = SvgCoreAttributes & {
  viewBox?: string
  preserveAspectRatio?: string
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  refX?: string | number
  refY?: string | number
}

/** Attributes for the `<use>` element. */
export type SvgUseAttributes = SvgCoreAttributes & {
  href?: string
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
}

/** Attributes for the `<path>` element. */
export type SvgPathAttributes = SvgCoreAttributes & {
  d: string
  pathLength?: number
}

/** Attributes for the `<rect>` element. */
export type SvgRectAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  rx?: string | number
  ry?: string | number
  pathLength?: number
}

/** Attributes for the `<circle>` element. */
export type SvgCircleAttributes = SvgCoreAttributes & {
  cx?: string | number
  cy?: string | number
  r?: string | number
  pathLength?: number
}

/** Attributes for the `<ellipse>` element. */
export type SvgEllipseAttributes = SvgCoreAttributes & {
  cx?: string | number
  cy?: string | number
  rx?: string | number
  ry?: string | number
  pathLength?: number
}

/** Attributes for the `<line>` element. */
export type SvgLineAttributes = SvgCoreAttributes & {
  x1?: string | number
  y1?: string | number
  x2?: string | number
  y2?: string | number
  pathLength?: number
}

/** Attributes for the `<polyline>` element. */
export type SvgPolylineAttributes = SvgCoreAttributes & {
  points?: string
  pathLength?: number
}

/** Attributes for the `<polygon>` element. */
export type SvgPolygonAttributes = SvgCoreAttributes & {
  points?: string
  pathLength?: number
}

/** Attributes for the `<text>` element. */
export type SvgTextAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  dx?: string | number
  dy?: string | number
  rotate?: string
  textLength?: string | number
  lengthAdjust?: 'spacing' | 'spacingAndGlyphs'
}

/** Attributes for the `<tspan>` element. */
export type SvgTspanAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  dx?: string | number
  dy?: string | number
  rotate?: string
  textLength?: string | number
  lengthAdjust?: 'spacing' | 'spacingAndGlyphs'
}

/** Attributes for the `<textPath>` element. */
export type SvgTextPathAttributes = SvgCoreAttributes & {
  href?: string
  method?: 'align' | 'stretch'
  spacing?: 'auto' | 'exact'
  startOffset?: string | number
  textLength?: string | number
  lengthAdjust?: 'spacing' | 'spacingAndGlyphs'
}

/** Attributes for the `<clipPath>` element. */
export type SvgClipPathAttributes = SvgCoreAttributes & {
  clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
}

/** Attributes for the `<mask>` element. */
export type SvgMaskAttributes = SvgCoreAttributes & {
  maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
}

/** Attributes for the `<linearGradient>` element. */
export type SvgLinearGradientAttributes = SvgCoreAttributes & {
  x1?: string | number
  y1?: string | number
  x2?: string | number
  y2?: string | number
  gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  gradientTransform?: string
  spreadMethod?: 'pad' | 'reflect' | 'repeat'
  href?: string
}

/** Attributes for the `<radialGradient>` element. */
export type SvgRadialGradientAttributes = SvgCoreAttributes & {
  cx?: string | number
  cy?: string | number
  r?: string | number
  fx?: string | number
  fy?: string | number
  fr?: string | number
  gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  gradientTransform?: string
  spreadMethod?: 'pad' | 'reflect' | 'repeat'
  href?: string
}

/** Attributes for the `<stop>` element. */
export type SvgStopAttributes = SvgCoreAttributes & {
  offset?: string | number
  'stop-color'?: string
  'stop-opacity'?: string | number
}

/** Attributes for the `<pattern>` element. */
export type SvgPatternAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  patternTransform?: string
  viewBox?: string
  preserveAspectRatio?: string
  href?: string
}

/** Attributes for the `<marker>` element. */
export type SvgMarkerAttributes = SvgCoreAttributes & {
  viewBox?: string
  preserveAspectRatio?: string
  refX?: string | number
  refY?: string | number
  markerUnits?: 'strokeWidth' | 'userSpaceOnUse'
  markerWidth?: string | number
  markerHeight?: string | number
  orient?: string
}

/** Attributes for the `<filter>` element. */
export type SvgFilterAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
}

/** Common attributes for SVG filter primitive elements. */
type SvgFilterPrimitiveAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  result?: string
}

/** Attributes for the `<feGaussianBlur>` element. */
export type SvgFeGaussianBlurAttributes = SvgFilterPrimitiveAttributes & {
  in?: string
  stdDeviation?: string | number
  edgeMode?: 'duplicate' | 'wrap' | 'none'
}

/** Attributes for the `<feBlend>` element. */
export type SvgFeBlendAttributes = SvgFilterPrimitiveAttributes & {
  in?: string
  in2?: string
  mode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
}

/** Attributes for the `<feColorMatrix>` element. */
export type SvgFeColorMatrixAttributes = SvgFilterPrimitiveAttributes & {
  in?: string
  type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha'
  values?: string
}

/** Attributes for the `<feOffset>` element. */
export type SvgFeOffsetAttributes = SvgFilterPrimitiveAttributes & {
  in?: string
  dx?: string | number
  dy?: string | number
}

/** Attributes for the `<feFlood>` element. */
export type SvgFeFloodAttributes = SvgFilterPrimitiveAttributes & {
  'flood-color'?: string
  'flood-opacity'?: string | number
}

/** Attributes for the `<feMerge>` element. */
export type SvgFeMergeAttributes = SvgFilterPrimitiveAttributes

/** Attributes for the `<feMergeNode>` element. */
export type SvgFeMergeNodeAttributes = SvgCoreAttributes & {
  in?: string
}

/** Attributes for the `<feComposite>` element. */
export type SvgFeCompositeAttributes = SvgFilterPrimitiveAttributes & {
  in?: string
  in2?: string
  operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'lighter' | 'arithmetic'
  k1?: number
  k2?: number
  k3?: number
  k4?: number
}

/** Attributes for the `<image>` element (SVG). */
export type SvgImageAttributes = SvgCoreAttributes & {
  href?: string
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  preserveAspectRatio?: string
  crossorigin?: 'anonymous' | 'use-credentials'
}

/** Attributes for the `<foreignObject>` element. */
export type SvgForeignObjectAttributes = SvgCoreAttributes & {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
}

/** Common attributes for SVG animation elements. */
type SvgAnimationAttributes = SvgCoreAttributes & {
  attributeName?: string
  begin?: string
  dur?: string
  end?: string
  repeatCount?: string | number
  repeatDur?: string
  fill?: 'freeze' | 'remove'
  from?: string
  to?: string
  by?: string
  values?: string
  keyTimes?: string
  keySplines?: string
  calcMode?: 'discrete' | 'linear' | 'paced' | 'spline'
}

/** Attributes for the `<animate>` element. */
export type SvgAnimateAttributes = SvgAnimationAttributes

/** Attributes for the `<animateMotion>` element. */
export type SvgAnimateMotionAttributes = SvgAnimationAttributes & {
  path?: string
  rotate?: string
}

/** Attributes for the `<animateTransform>` element. */
export type SvgAnimateTransformAttributes = SvgAnimationAttributes & {
  type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY'
}

/** Attributes for the `<set>` element. */
export type SvgSetAttributes = SvgCoreAttributes & {
  attributeName?: string
  to?: string
  begin?: string
  dur?: string
  end?: string
  repeatCount?: string | number
  fill?: 'freeze' | 'remove'
}

/** Attributes for the `<title>` element (SVG). */
export type SvgTitleAttributes = SvgCoreAttributes

/** Attributes for the `<desc>` element. */
export type SvgDescAttributes = SvgCoreAttributes
