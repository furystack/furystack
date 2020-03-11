import { RequestAction, JsonResult } from '@furystack/rest'

/**
 * Default fall back "Not Found" (404) action
 */
export const NotFoundAction: RequestAction<{ result: { error: string } }> = async () => {
  return JsonResult(
    {
      error: 'Content not found',
    },
    404,
  )
}
