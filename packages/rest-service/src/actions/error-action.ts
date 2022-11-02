import { RequestError } from '@furystack/rest'
import { AuthorizationError } from '@furystack/core'
import type { RequestAction } from '../request-action-implementation'
import { JsonResult } from '../request-action-implementation'
import { SchemaValidationError } from '../schema-validator'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
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
