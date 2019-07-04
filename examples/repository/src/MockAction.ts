import { RequestAction, JsonResult, Authorize } from '@furystack/http-api'

/**
 * Example mock action
 */

export const MockAction: RequestAction = Authorize('Alma')(async injector => {
  const msg = injector.getRequest()
  return JsonResult({
    success: true,
    incoming: {
      url: msg.url,
      headers: msg.headers,
      method: msg.method,
    },
  })
})
