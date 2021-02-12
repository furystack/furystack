import { RequestError } from '@furystack/rest'
import { AuthorizationError } from '@furystack/core'
import { JsonResult, RequestActionImplementation } from '../request-action-implementation'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */

export const ErrorAction: RequestActionImplementation<{
  body: Error
  result: { message: string; url?: string; stack?: string }
}> = async ({ getBody, request }) => {
  const body = await getBody()
  const errorCode = body instanceof RequestError ? body.responseCode : body instanceof AuthorizationError ? 403 : 500

  return JsonResult({ message: body.message, url: request.url, stack: body.stack }, errorCode)
}
