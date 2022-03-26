export class PasswordComplexityError extends Error {
  /**
   * @param result A detailed error result array
   * @param message The Error message
   */
  constructor(public readonly result: Array<{ message: string; rule: string }>, message?: string) {
    super(message)
  }
}
