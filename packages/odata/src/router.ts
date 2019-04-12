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
import { NamespaceBuilder } from './namespace-builder'
import { OdataContext } from './odata-context'

/**
 * Factory methods that creates an OData Route based on the provided parameters
 * @param options The provided Options object
 */
export const createOdataRouter: (options: {
  route: string
  namespaces: NamespaceBuilder[]
}) => IRouteModel = options => {
  const collectionsWithUrls = options.namespaces
    .flatMap(ns => Array.from(ns.collections.collections.values()))
    .flatMap(c => ({
      collection: c,
      url: PathHelper.trimSlashes(`${options.route}/${c.name}`),
    }))

  const entities = options.namespaces.flatMap(ns => Array.from(ns.entities.entities.values()))

  return (msg, injector) => {
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
        entities,
        collections: collectionsWithUrls,
      },
      OdataContext,
    )

    if (collection) {
      const entity = entities.find(e => e.model === collection.collection.model)

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
                    navigationProperty.getRelatedEntity
                      ? `${Array.from(injector.getInstance(ModelBuilder).namespaces.values())[0].name}.${
                          navigationProperty.relatedModel.name
                        }`
                      : navigationProperty.dataSet
                  }`,
                ),
                navigationProperty,
              },
              OdataContext,
            )
            return NavigationPropertyAction
          }
          const navigationPropertyCollection =
            entity &&
            entity.navigationPropertyCollection &&
            entity.navigationPropertyCollection.find(
              a =>
                PathHelper.joinPaths(collection.url + entitySegment, a.propertyName) === urlPathName ||
                PathHelper.joinPaths(collection.url, entitySegment, a.propertyName) === urlPathName,
            )

          if (navigationPropertyCollection) {
            injector.setExplicitInstance(
              {
                ...injector.getInstance(OdataContext),
                context: PathHelper.joinPaths(
                  server,
                  options.route,
                  `$metadata#${navigationPropertyCollection.dataSet}`,
                ),
                navigationPropertyCollection,
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
    const globalFunction = options.namespaces
      .flatMap(ns => ns.functions.map(f => ({ ...f, namespace: ns.name })))
      .find(a => urlPathName === `${options.route}/${a.namespace}.${a.name}`)
    if (msg.method === 'GET' && globalFunction) {
      return globalFunction.action
    }

    // Global actions
    const globalAction = options.namespaces
      .flatMap(ns => ns.actions.map(a => ({ ...a, namespace: ns.name })))
      .find(a => urlPathName === `${options.route}/${a.namespace}.${a.name}`)
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
