export class PasswordResetToken {
  /**
   * The related user name
   */
  declare userName: string
  /**
   * The Token value - should be some kind of generated UUID that can be included e.g. in URLs
   */
  declare token: string
  /**
   * The creation date in an ISO datetime format
   */
  declare createdAt: string
}
