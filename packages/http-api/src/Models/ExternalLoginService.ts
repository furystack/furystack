import { User } from '@furystack/core'

/**
 * Interface for implementing an external login provider
 */
export interface ExternalLoginService {
  /**
   * Logs in the current user with the provided data
   * @param args The arguments from the login service
   */
  login(...args: any[]): Promise<User>
}
