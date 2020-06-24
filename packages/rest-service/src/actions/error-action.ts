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
}> = async ({ injector, getBody, request }) => {
  const body = await getBody()
  const errorCode = body instanceof RequestError ? body.responseCode : body instanceof AuthorizationError ? 403 : 500

  if (errorCode >= 500 && errorCode <= 511) {
    injector.logger.warning({
      scope: '@furystack/rest-service',
      message: `An action throwed error from '${request.url}'.`,
      data: {
        error: body,
      },
    })
  }

  return JsonResult({ message: body.message, url: request.url, stack: body.stack }, errorCode)
}
