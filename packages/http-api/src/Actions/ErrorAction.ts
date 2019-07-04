import { IncomingMessage } from 'http'
import { RequestAction, JsonResult } from '../Models'

/**
 * Action for unhandled (500) errors
 * Returns a serialized error instance in JSON format.
 */

export const ErrorAction: RequestAction = async injector => {
  const error = injector.getInstance(Error)
  const msg = injector.getInstance(IncomingMessage)
  injector.logger.warning({
    message: `An action returned 500 from '${msg.url}'.`,
    data: {
      error,
    },
  })
  return JsonResult({ chunk: { message: error.message, url: msg.url, stack: error.stack } })
}
