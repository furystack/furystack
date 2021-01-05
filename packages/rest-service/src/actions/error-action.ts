import { RequestAction, JsonResult } from '@furystack/rest'
import { RequestError } from '@furystack/rest'
import { AuthorizationError } from '@furystack/core'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */

export const ErrorAction: RequestAction<{
  body: Error
  result: { message: string; url?: string; stack?: string }
}> = async ({ getBody, request }) => {
  const body = await getBody()
  const errorCode = body instanceof RequestError ? body.responseCode : body instanceof AuthorizationError ? 403 : 500

  return JsonResult({ message: body.message, url: request.url, stack: body.stack }, errorCode)
}
