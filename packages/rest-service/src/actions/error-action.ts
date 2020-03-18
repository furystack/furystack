import { IncomingMessage } from 'http'
import { RequestAction, JsonResult } from '@furystack/rest'
import { RequestError } from '@furystack/rest'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */

export const ErrorAction: RequestAction<{
  body: Error
  result: { message: string; url?: string; stack?: string }
}> = async ({ injector, getBody }) => {
  const msg = injector.getInstance(IncomingMessage)
  const body = await getBody()
  injector.logger.warning({
    scope: '@furystack/rest-service',
    message: `An action returned 500 from '${msg.url}'.`,
    data: {
      error: body,
    },
  })
  return JsonResult(
    { message: body.message, url: msg.url, stack: body.stack },
    body instanceof RequestError ? body.responseCode : 500,
  )
}
