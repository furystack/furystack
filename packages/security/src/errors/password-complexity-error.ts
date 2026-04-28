import type { PasswordComplexityRule } from '../models/password-complexity-rule.js'

/**
 * Thrown by password-setting flows when the candidate password fails one or
 * more configured {@link PasswordComplexityRule}s. `result` carries the
 * per-rule failures so callers can render targeted user feedback.
 */
export class PasswordComplexityError extends Error {
  constructor(
    public readonly result: Array<{ message: string; rule: string }>,
    message?: string,
  ) {
    super(message)
  }
}
