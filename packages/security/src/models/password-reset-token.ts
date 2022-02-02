export class PasswordResetToken {
  /**
   * The related user name
   */
  userName!: string
  /**
   * The Token value - should be some kind of generated UUID that can be included e.g. in URLs
   */
  token!: string
  /**
   * The creation date in an ISO datetime format
   */
  createdAt!: string
}
