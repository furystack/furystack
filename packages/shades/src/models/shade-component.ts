import type { ChildrenList } from './children-list.js'

/**
 * Callable that produces a JSX element from props (and optional children).
 * Both `Shade(...)` factories and plain functional components conform to
 * this shape.
 */
export type ShadeComponent<TProps = object> = (arg: TProps, children?: ChildrenList) => JSX.Element

/**
 * Discriminates {@link ShadeComponent} from intrinsic-element tag names.
 * Intentionally permissive — any function is treated as a component since
 * VNodes carry no other discriminator.
 */
export const isShadeComponent = <T = any>(obj: any): obj is ShadeComponent<T> => {
  return typeof obj === 'function'
}
