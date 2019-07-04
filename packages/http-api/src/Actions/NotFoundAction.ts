import { IncomingMessage } from 'http'
import { RequestAction, JsonResult } from '../Models'

/**
 * Default fall back "Not Found" (404) action
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
