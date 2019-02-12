import { Disposable } from '@sensenet/client-utils'

/**
 * Interface for a HTTP Request action
 */
export interface IRequestAction extends Disposable {
  exec(): Promise<void>
}
