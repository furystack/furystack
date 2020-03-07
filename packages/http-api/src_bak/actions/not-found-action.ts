import { IncomingMessage } from 'http'
import { RequestAction, JsonResult } from '../models/request-action'

/**
 * Default fall back "Not Found" (404) action
 *
 * @param injector The injector from the current stack
 */
export const NotFoundAction: RequestAction = async injector => {
  return JsonResult(
    {
      Error: 'Content not found',
      url: injector.getInstance(IncomingMessage).url,
    },
    404,
  )
}
