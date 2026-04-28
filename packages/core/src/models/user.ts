/**
 * Minimal user model. Most application code will extend this with additional
 * profile fields and re-export the augmented type.
 */
export class User {
  declare username: string
  declare roles: string[]
}
