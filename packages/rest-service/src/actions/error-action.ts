import { RequestError } from '@furystack/rest'
import { AuthorizationError } from '@furystack/core'
import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'
import { SchemaValidationError } from '../schema-validator/schema-validation-error.js'

/**
 * Default error handler. Maps thrown errors to HTTP responses:
 *
 * - {@link SchemaValidationError} → 400 with `{ message, errors }`
 * - {@link RequestError} → its `responseCode` with `{ message }`
 * - {@link AuthorizationError} → 403 with `{ message }`
 * - other `Error` → 500 with `{ message }`
 * - non-Error throwables → 500 with a generic message
 */
export const ErrorAction: RequestAction<{
  body: unknown
  result: { message: string }
}> = async ({ getBody }) => {
  const body = await getBody()

  if (body instanceof SchemaValidationError) {
    return JsonResult({ message: body.message, errors: body.errors }, 400)
  }

  if (body instanceof RequestError) {
    return JsonResult({ message: body.message }, body.responseCode)
  }

  if (body instanceof AuthorizationError) {
    return JsonResult({ message: body.message }, 403)
  }

  if (body instanceof Error) {
    return JsonResult({ message: body.message }, 500)
  }

  return JsonResult({ message: 'An unexpected error happened' }, 500)
}
