import { Disposable } from '@sensenet/client-utils'

/**
 * Interface for a HTTP Request action
 */
export interface IRequestAction extends Disposable {
  /**
   * The method will be executed for each request
   */
  exec(): Promise<void>
}
