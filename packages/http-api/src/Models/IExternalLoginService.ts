import { User } from '@furystack/core'

/**
 * Interface for implementing an external login provider
 */
export interface IExternalLoginService<TUser extends User, TArgs extends any[]> {
  /**
   * Logs in the current user with the provided data
   * @param args The arguments from the login service
   */
  login(...args: TArgs): Promise<TUser>
}
