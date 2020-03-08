import { IncomingMessage } from 'http'
import { RequestAction, JsonResult } from '@furystack/rest'
import { RequestError } from './request-error'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */

export const ErrorAction: RequestAction<{ message: string; url?: string; stack?: string }, any, Error> = async ({
  injector,
  body,
}) => {
  const msg = injector.getInstance(IncomingMessage)
  injector.logger.warning({
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
