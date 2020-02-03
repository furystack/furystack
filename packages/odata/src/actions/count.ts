import { OdataContext } from '../odata-context'
import { RequestAction, PlainTextResult } from '@furystack/http-api'
import { Repository } from '@furystack/repository'

/**
 * OData Count action
 */
export const OdataCount: RequestAction = async injector => {
  const context = injector.getInstance(OdataContext)
  const dataSet = injector.getInstance(Repository).getDataSetFor<any>(context.collection.name)
  const count = await dataSet.count(injector)
  return PlainTextResult(count.toString() || '0', undefined, { 'odata.metadata': 'none' })
}
