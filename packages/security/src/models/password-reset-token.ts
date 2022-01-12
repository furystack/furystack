export class PasswordResetToken {
  /**
   * The related user name
   */
  userName!: string
  /**
   * The Token value
   */
  token!: string
  /**
   * The creation date in an ISO datetime format
   */
  createdAt!: string
}
