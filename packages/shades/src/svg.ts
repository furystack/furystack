/**
 * SVG namespace and tag detection helpers.
 */

export const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Set of known SVG element tag names.
 * Used to determine whether to create elements with `createElementNS`
 * and to apply attributes via `setAttribute` instead of property assignment.
 */
export const SVG_TAGS: ReadonlySet<string> = new Set([
  // Root
  'svg',
  // Container / structural
  'g',
  'defs',
  'symbol',
  'use',
  'foreignObject',
  // Shape elements
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  // Text
  'text',
  'tspan',
  'textPath',
  // Gradient / pattern
  'linearGradient',
  'radialGradient',
  'stop',
  'pattern',
  // Clipping / masking
  'clipPath',
  'mask',
  // Marker
  'marker',
  // Filter
  'filter',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feFlood',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'feSpecularLighting',
  'feTile',
  'feTurbulence',
  // Animation
  'animate',
  'animateMotion',
  'animateTransform',
  'set',
  // Descriptive
  'title',
  'desc',
  'metadata',
  // Other
  'image',
])

/**
 * Returns true if the given tag name is a known SVG element.
 */
export const isSvgTag = (tag: string): boolean => SVG_TAGS.has(tag)
