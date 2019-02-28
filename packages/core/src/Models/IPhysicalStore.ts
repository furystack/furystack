import { Disposable } from '@sensenet/client-utils'

export type DefaultFilter<T> = Partial<T> & { top?: number; skip?: number }

/**
 * Interface that defines a physical store implementation
 */
export interface IPhysicalStore<T, TFilter = DefaultFilter<T>> extends Disposable {
  readonly primaryKey: keyof T
  add(data: T): Promise<T>
  update(id: T[this['primaryKey']], data: T): Promise<void>
  count(): Promise<number>
  filter(filter: TFilter): Promise<T[]>
  get(key: T[this['primaryKey']]): Promise<T | undefined>
  remove(key: T[this['primaryKey']]): Promise<void>
}
