import { ChildrenList } from './children-list'

/**
 * Type definition for a Shade component
 */
export type ShadeComponent<TProps = {}> = (arg: TProps, children?: ChildrenList) => JSX.Element

/**
 * Type guard that checks if an object is a stateless component
 * @param obj The object to check
 */
export const isShadeComponent = (obj: any): obj is ShadeComponent<any> => {
  return typeof obj === 'function'
}
