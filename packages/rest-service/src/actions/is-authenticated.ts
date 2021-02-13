import { JsonResult, RequestAction } from '../request-action-implementation'

/**
 * Action that returns if the current user is authenticated
 *
 * @param options The options for the Custom Action
 * @param options.injector The Injector from the current context
 * @returns A standard authentication result
 */
export const IsAuthenticated: RequestAction<{ result: { isAuthenticated: boolean } }> = async ({
  injector,
}) => {
  const isAuthenticated = await injector.isAuthenticated()
  return JsonResult({ isAuthenticated })
}
