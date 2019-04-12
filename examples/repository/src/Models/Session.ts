/**
 * Model that defines a session type
 */
export class Session {
  public sessionId!: string
  public username!: string
  public userAgent!: string
  public ip!: string
  public loginDate!: Date
}
