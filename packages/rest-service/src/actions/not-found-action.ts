import type { RequestAction } from '../request-action-implementation.js'
import { JsonResult } from '../request-action-implementation.js'

/** Default `404` action. Returns `{ error: 'Content not found' }`. */
export const NotFoundAction: RequestAction<{ result: { error: string } }> = async () => {
  return JsonResult(
    {
      error: 'Content not found',
    },
    404,
  )
}
