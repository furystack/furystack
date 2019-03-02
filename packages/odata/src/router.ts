import { IRouteModel } from '@furystack/http-api'
import { PathHelper } from '@sensenet/client-utils'
import { parse } from 'url'
import { DeleteAction } from './actions/delete'
import { GetCollectionAction } from './actions/get-collection-action'
import { GetEntityAction } from './actions/get-entity-action'
import { MetadataAction } from './actions/metadata-action'
import { PatchAction } from './actions/patch'
import { PostAction } from './actions/post'
import { PutAction } from './actions/put'
import { RootAction } from './actions/root-action'
import { Collection, Entity, OdataGlobalAction } from './models'
import { OdataContext } from './odata-context'

/**
 * Factory methods that creates an OData Route based on the provided parameters
 * @param options The provided Options object
 */
export const createOdataRouter: (options: {
  route: string
  entities: Array<Entity<any>>
  collections: Array<Collection<any>>
  globalActions: Array<OdataGlobalAction<any, any>>
  globalFunctions: Array<OdataGlobalAction<any, any>>
}) => IRouteModel = options => {
  const collectionsWithUrls = options.collections.map(c => ({
    collection: c,
    url: PathHelper.trimSlashes(`${options.route}/${c.name}`),
  }))

  return (msg, injector) => {
    const urlPathName = PathHelper.trimSlashes(parse(decodeURI(msg.url || ''), true).pathname || '')

    if (collectionsWithUrls.findIndex(curl => urlPathName.indexOf(curl.url) !== -1) !== -1) {
      if (collectionsWithUrls.findIndex(c => c.url === urlPathName) !== -1) {
        const value = collectionsWithUrls.find(c => c.url === urlPathName) as {
          collection: Collection<any>
          url: string
        }

        injector.setExplicitInstance(
          { collection: value.collection } as OdataContext<typeof value.collection.model>,
          OdataContext,
        )
        switch (msg.method) {
          case 'GET':
            return GetCollectionAction
          case 'POST':
            return PostAction
        }
      }
      if (PathHelper.isItemPath(urlPathName)) {
        switch (msg.method) {
          case 'GET':
            return GetEntityAction
          case 'PUT':
            return PutAction
          case 'PATCH':
            return PatchAction
          case 'DELETE':
            return DeleteAction
        }
      }
    }

    if (msg.method === 'GET' && urlPathName === `${options.route}/$metadata`) {
      return MetadataAction
    }

    if (urlPathName.indexOf(options.route) === 0) {
      return RootAction
    }
  }
}
