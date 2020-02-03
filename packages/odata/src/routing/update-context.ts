import { Injector } from '@furystack/inject'
import { OdataContext } from '../odata-context'

/**
 * updates the OData Context based on a partial ODataContext instance
 * @param injector The injector instance
 * @param context Partial context model
 */
export const updateContext = <T>(injector: Injector, context: Partial<OdataContext<T>>) => {
  injector.setExplicitInstance(
    {
      ...injector.getInstance(OdataContext),
      ...context,
    },
    OdataContext,
  )
}
