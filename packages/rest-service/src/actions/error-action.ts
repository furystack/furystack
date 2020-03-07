import { IncomingMessage } from 'http'
import { RequestAction, JsonResult } from '@furystack/rest'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */

export const ErrorAction: RequestAction<{ message: string; url?: string; stack?: string }, any, any> = async ({
  injector,
}) => {
  const error = injector.getInstance(Error)
  const msg = injector.getInstance(IncomingMessage)
  injector.logger.warning({
    message: `An action returned 500 from '${msg.url}'.`,
    data: {
      error,
    },
  })
  return JsonResult({ message: error.message, url: msg.url, stack: error.stack }, 500)
}
