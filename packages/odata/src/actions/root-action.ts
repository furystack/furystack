import { OdataContext } from '../odata-context'
import { RequestAction, JsonResult } from '@furystack/http-api'
import { PathHelper } from '@furystack/utils'

/**
 * OData Root action
 */
export const RootAction: RequestAction = async injector => {
  const ctx = injector.getInstance(OdataContext)
  const req = injector.getRequest()
  return JsonResult({
    '@odata.context': PathHelper.joinPaths(ctx.server, req.url as string, '$metadata'),
    value: [
      ...ctx.collections.map(collection => ({
        name: collection.name,
        kind: 'EntitySet',
        url: collection.name,
      })),
    ],
  })
}
