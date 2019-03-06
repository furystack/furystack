import { IRouteModel } from '@furystack/http-api'
import { PathHelper } from '@sensenet/client-utils'
import { TLSSocket } from 'tls'
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

    const collection = collectionsWithUrls.find(c => urlPathName.indexOf(c.url) !== -1)
    const server = (msg.connection as TLSSocket).encrypted
      ? `https://${msg.headers.host}/`
      : `http://${msg.headers.host}/`

    if (collection) {
      injector.setExplicitInstance(
        {
          ...injector.getInstance(OdataContext),
          collection: collection.collection,
          context: PathHelper.joinPaths(server, options.route, `$metadata#${collection.collection.name}`),
        } as OdataContext<typeof collection.collection.model>,
        OdataContext,
      )

      if (PathHelper.isItemPath(urlPathName)) {
        const entityId = PathHelper.getSegments(urlPathName)
          .filter(s => PathHelper.isItemSegment(s))[0]
          .replace(`('`, '')
          .replace(`')`, '')

        injector.setExplicitInstance(
          {
            ...injector.getInstance(OdataContext),
            context: PathHelper.joinPaths(server, options.route, `$metadata#${collection.collection.name}`, '$entity'),
            entityId,
          } as OdataContext<any>,
          OdataContext,
        )

        // ToDo: Check for entity property getters, actions, functions here

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

      // ToDo: Check for collection actions here

      switch (msg.method) {
        case 'GET':
          return GetCollectionAction
        case 'POST':
          return PostAction
      }
    }

    // ToDo: Check for global actions here

    if (msg.method === 'GET' && urlPathName === `${options.route}/$metadata`) {
      return MetadataAction
    }

    if (urlPathName.indexOf(options.route) === 0) {
      return RootAction
    }
  }
}
