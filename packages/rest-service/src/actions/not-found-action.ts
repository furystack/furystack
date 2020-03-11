import { RequestAction, JsonResult } from '@furystack/rest'

/**
 * Default fall back "Not Found" (404) action
 *
 * @param injector The injector from the current stack
 */
export const NotFoundAction: RequestAction<{ result: { error: string; url?: string } }> = async () => {
  return JsonResult(
    {
      error: 'Content not found',
    },
    404,
  )
}
