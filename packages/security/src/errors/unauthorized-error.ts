/**
 * Error that can be throwed if a specific authorization is needed but not provided
 */
export class UnauthorizedError extends Error {
  constructor(public readonly username: string, public readonly requiredRoles: string[], message?: string) {
    super(message)
  }
}
