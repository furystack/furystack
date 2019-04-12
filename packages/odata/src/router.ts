import { IRouteModel } from '@furystack/http-api'
import { PathHelper } from '@sensenet/client-utils'
import { ServerResponse } from 'http'
import { TLSSocket } from 'tls'
import { parse } from 'url'
import { DeleteAction } from './actions/delete'
import { GetCollectionAction } from './actions/get-collection-action'
import { GetEntityAction } from './actions/get-entity-action'
import { MetadataAction } from './actions/metadata-action'
import { NavigationPropertyAction } from './actions/navigation-property'
import { PatchAction } from './actions/patch'
import { PostAction } from './actions/post'
import { PutAction } from './actions/put'
import { RootAction } from './actions/root-action'
import { getOdataParams } from './getOdataParams'
import { ModelBuilder } from './model-builder'
import { Collection, Entity, NavigationProperty } from './models'
import { FunctionDescriptor } from './models/function-descriptor'
import { OdataContext } from './odata-context'

/**
 * Factory methods that creates an OData Route based on the provided parameters
 * @param options The provided Options object
 */
export const createOdataRouter: (options: {
  route: string
  entities: Array<Entity<any>>
  collections: Array<Collection<any>>
  globalActions: FunctionDescriptor[]
  globalFunctions: FunctionDescriptor[]
}) => IRouteModel = options => {
  const collectionsWithUrls = options.collections.map(c => ({
    collection: c,
    url: PathHelper.trimSlashes(`${options.route}/${c.name}`),
  }))

  return (msg, injector) => {
    injector.logger.verbose({
      scope: 'OData Router',
      message: `Incoming message: ${msg.url}`,
    })

    const urlPathName = PathHelper.trimSlashes(parse(msg.url || '', true).pathname || '')

    injector.getInstance(ServerResponse).setHeader('OData-Version', '4.0')

    const collection = collectionsWithUrls.find(c => urlPathName.indexOf(c.url) !== -1)
    const server = (msg.connection as TLSSocket).encrypted
      ? `https://${msg.headers.host}/`
      : `http://${msg.headers.host}/`

    injector.setExplicitInstance(
      {
        server,
        odataRoute: options.route,
        entities: options.entities,
        collections: options.collections,
      },
      OdataContext,
    )

    if (collection) {
      const entity = options.entities.find(e => e.model === collection.collection.model)

      injector.setExplicitInstance(
        {
          ...injector.getInstance(OdataContext),
          collection: collection.collection,
          context: PathHelper.joinPaths(server, options.route, `$metadata#${collection.collection.name}`),
          entity,
          queryParams: entity && getOdataParams(msg.url, entity),
        } as OdataContext<typeof collection.collection.model>,
        OdataContext,
      )

      if (PathHelper.isItemPath(urlPathName)) {
        const entitySegment = PathHelper.getSegments(urlPathName).filter(s => PathHelper.isItemSegment(s))[0]
        const entityId = entitySegment
          .replace(`('`, '')
          .replace(`')`, '')
          .replace('(', '')
          .replace(')', '')

        injector.setExplicitInstance(
          {
            ...injector.getInstance(OdataContext),
            entityId,
          } as OdataContext<any>,
          OdataContext,
        )

        if (msg.method === 'POST') {
          const currentAction =
            entity &&
            entity.actions &&
            entity.actions.find(
              a =>
                PathHelper.joinPaths(collection.url + entitySegment, a.name) === urlPathName ||
                PathHelper.joinPaths(collection.url, entitySegment, a.name) === urlPathName,
            )
          if (currentAction) {
            return currentAction.action
          }
        } else if (msg.method === 'GET') {
          const currentFunction =
            entity &&
            entity.functions &&
            entity.functions.find(
              a =>
                PathHelper.joinPaths(collection.url + entitySegment, a.name) === urlPathName ||
                PathHelper.joinPaths(collection.url, entitySegment, a.name) === urlPathName,
            )
          if (currentFunction) {
            return currentFunction.action
          }

          const navigationProperty =
            entity &&
            entity.navigationProperties &&
            entity.navigationProperties.find(
              a =>
                PathHelper.joinPaths(collection.url + entitySegment, a.propertyName) === urlPathName ||
                PathHelper.joinPaths(collection.url, entitySegment, a.propertyName) === urlPathName,
            )

          if (navigationProperty) {
            injector.setExplicitInstance(
              {
                ...injector.getInstance(OdataContext),
                context: PathHelper.joinPaths(
                  server,
                  options.route,
                  `$metadata#${
                    (navigationProperty as NavigationProperty<any>).getRelatedEntity
                      ? `${Array.from(injector.getInstance(ModelBuilder).namespaces.values())[0].name}.${
                          navigationProperty.relatedModel.name
                        }`
                      : navigationProperty.dataSet
                  }`,
                ),
                navigationProperty,
              } as OdataContext<any>,
              OdataContext,
            )
            return NavigationPropertyAction
          }
        }

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

      // Collection functions
      const collectionFunction =
        collection.collection.functions &&
        collection.collection.functions.find(a => urlPathName === `${collection.url}/${a.name}`)
      if (msg.method === 'GET' && collectionFunction) {
        return collectionFunction.action
      }

      const collectionAction =
        collection.collection.actions &&
        collection.collection.actions.find(a => urlPathName === `${collection.url}/${a.name}`)
      if (msg.method === 'GET' && collectionAction) {
        return collectionAction.action
      }

      switch (msg.method) {
        case 'GET':
          return GetCollectionAction
        case 'POST':
          return PostAction
      }
    }

    // Global functions
    const globalFunction = options.globalFunctions.find(a => urlPathName === `${options.route}/${a.name}`)
    if (msg.method === 'GET' && globalFunction) {
      return globalFunction.action
    }

    // Global actions
    const globalAction = options.globalActions.find(a => urlPathName === `${options.route}/${a.name}`)
    if (msg.method === 'POST' && globalAction) {
      return globalAction.action
    }

    if (msg.method === 'GET' && urlPathName === `${options.route}/$metadata`) {
      return MetadataAction
    }

    if (urlPathName === options.route) {
      return RootAction
    }
  }
}
