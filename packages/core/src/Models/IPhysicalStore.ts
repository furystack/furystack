import { Disposable } from '@sensenet/client-utils'
import { ILogger } from './ILogger'

/**
 * Interface that defines a physical store implementation
 */
export interface IPhysicalStore<T, K extends keyof T = keyof T, TFilter = Partial<T> & { top?: number; skip?: number }>
  extends Disposable {
  readonly primaryKey: K
  logger: ILogger
  add(data: T): Promise<T>
  update(id: T[this['primaryKey']], data: T): Promise<void>
  count(): Promise<number>
  filter(filter: TFilter): Promise<T[]>
  get(key: T[this['primaryKey']]): Promise<T | undefined>
  remove(key: T[this['primaryKey']]): Promise<void>
}
