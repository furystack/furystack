import type { ChildrenList } from './children-list.js'

/**
 * Type definition for a Shade component
 */
export type ShadeComponent<TProps = object> = (arg: TProps, children?: ChildrenList) => JSX.Element

/**
 * Type guard that checks if an object is a stateless component
 * @param obj The object to check
 * @returns a value that indicates if the object is a Shade component
 */
export const isShadeComponent = <T = any>(obj: any): obj is ShadeComponent<T> => {
  return typeof obj === 'function'
}
