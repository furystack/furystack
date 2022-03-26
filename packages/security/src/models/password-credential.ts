/**
 * Entry that stores credential info for password login
 */
export class PasswordCredential {
  /**
   * The unique name of the user
   */
  userName!: string
  /**
   * The hashed password value
   */
  passwordHash!: string

  /**
   * Salt value for password hashing // TODO
   */
  salt!: string

  /**
   * The Creation date in ISO String format
   */
  creationDate!: string
}
