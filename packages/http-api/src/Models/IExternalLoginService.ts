import { User } from '@furystack/core'

/**
 * Interface for implementing an external login provider
 */
export interface IExternalLoginService<TUser extends User, TArgs extends any[]> {
  login(...args: TArgs): Promise<TUser>
}
