import { RequestError } from '@furystack/rest'
import { ErrorObject } from 'ajv'

/**
 * Custom Error class for Schema Validation Errors
 */
export class SchemaValidationError extends RequestError {
  constructor(public readonly errors: ErrorObject[]) {
    super('Schema Validation failed', 400)
  }
}
