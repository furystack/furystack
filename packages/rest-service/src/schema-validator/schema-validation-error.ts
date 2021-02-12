import { ErrorObject } from 'ajv'

/**
 * Custom Error class for Schema Validation Errors
 */
export class SchemaValidationError extends Error {
  constructor(public readonly errors: ErrorObject[]) {
    super('Schema Validation failed')
  }
}
