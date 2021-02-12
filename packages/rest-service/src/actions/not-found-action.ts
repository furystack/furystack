import { JsonResult, RequestActionImplementation } from '../request-action-implementation'

/**
 * @returns The standard Not Found action result
 */
export const NotFoundAction: RequestActionImplementation<{ result: { error: string } }> = async () => {
  return JsonResult(
    {
      error: 'Content not found',
    },
    404,
  )
}
