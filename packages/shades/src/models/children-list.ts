/**
 * The type for children passed to Shade components and intrinsic JSX elements.
 * Supports strings, HTML/SVG elements, JSX elements, and nested arrays of these.
 */
export type ChildrenList = Array<
  string | HTMLElement | SVGElement | JSX.Element | string[] | HTMLElement[] | SVGElement[] | JSX.Element[]
>
