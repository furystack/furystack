/**
 * Entry that stores credential info for password login
 */
export class PasswordCredential {
  /**
   * The unique name of the user
   */
  declare userName: string
  /**
   * The hashed password value
   */
  declare passwordHash: string

  /**
   * Salt value for password hashing // TODO
   */
  declare salt: string

  /**
   * The Creation date in ISO String format
   */
  declare creationDate: string
}
