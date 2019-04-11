import { IRequestAction, IRouteModel } from '@furystack/http-api'
import { Constructable } from '@furystack/inject'
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
import { OdataContext } from './odata-context'

/**
 * Factory methods that creates an OData Route based on the provided parameters
 * @param options The provided Options object
 */
export const createOdataRouter: (options: {
  route: string
  entities: Array<Entity<any>>
  collections: Array<Collection<any>>
  globalActions: { [key: string]: Constructable<IRequestAction> }
  globalFunctions: { [key: string]: Constructable<IRequestAction> }
}) => IRouteModel = options => {
  const collectionsWithUrls = options.collections.map(c => ({
    collection: c,
    url: PathHelper.trimSlashes(`${options.route}/${c.name}`),
  }))

  return (msg, injector) => {
    const urlPathName = PathHelper.trimSlashes(parse(decodeURI(msg.url || ''), true).pathname || '')

    injector.getInstance(ServerResponse).setHeader('OData-Version', '4.0')

    const collection = collectionsWithUrls.find(c => urlPathName.indexOf(c.url) !== -1)
    const server = (msg.connection as TLSSocket).encrypted
      ? `https://${msg.headers.host}/`
      : `http://${msg.headers.host}/`

    injector.setExplicitInstance(
      {
        server,
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
            Object.entries(entity.actions).find(
              a =>
                PathHelper.joinPaths(collection.url + entitySegment, a[0]) === urlPathName ||
                PathHelper.joinPaths(collection.url, entitySegment, a[0]) === urlPathName,
            )
          if (currentAction) {
            return currentAction[1].action
          }
        } else if (msg.method === 'GET') {
          const currentFunction =
            entity &&
            entity.functions &&
            Object.entries(entity.functions).find(
              a =>
                PathHelper.joinPaths(collection.url + entitySegment, a[0]) === urlPathName ||
                PathHelper.joinPaths(collection.url, entitySegment, a[0]) === urlPathName,
            )
          if (currentFunction) {
            return currentFunction[1].action
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
        Object.entries(collection.collection.functions).find(a => urlPathName === `${collection.url}/${a[0]}`)
      if (msg.method === 'GET' && collectionFunction) {
        return collectionFunction[1].action
      }

      const collectionAction =
        collection.collection.actions &&
        Object.entries(collection.collection.actions).find(a => urlPathName === `${collection.url}/${a[0]}`)
      if (msg.method === 'GET' && collectionAction) {
        return collectionAction[1].action
      }

      switch (msg.method) {
        case 'GET':
          return GetCollectionAction
        case 'POST':
          return PostAction
      }
    }

    // Global functions
    const globalFunction = Object.entries(options.globalFunctions).find(a => urlPathName === `${options.route}/${a[0]}`)
    if (msg.method === 'GET' && globalFunction) {
      return globalFunction[1]
    }

    // Global actions
    const globalAction = Object.entries(options.globalActions).find(a => urlPathName === `${options.route}/${a[0]}`)
    if (msg.method === 'POST' && globalAction) {
      return globalAction[1]
    }

    if (msg.method === 'GET' && urlPathName === `${options.route}/$metadata`) {
      return MetadataAction
    }

    if (urlPathName.indexOf(options.route) === 0) {
      return RootAction
    }
  }
}
