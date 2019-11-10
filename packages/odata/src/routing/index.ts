import { ServerResponse } from 'http'
import { TLSSocket } from 'tls'
import { parse } from 'url'
import { RouteModel } from '@furystack/http-api'
import { PathHelper } from '@furystack/utils'
import { GetCollectionAction } from '../actions/get-collection-action'
import { MetadataAction } from '../actions/metadata-action'
import { PostAction } from '../actions/post'
import { RootAction } from '../actions/root-action'
import { getOdataParams } from '../get-odata-params'
import { Entity } from '../models'
import { getEntityRoute } from './get-entity-route'
import { RouterOptions } from './router-options'
import { updateContext } from './update-context'

// TempHacks before Sn-client update, can be removed after next release
PathHelper.isItemSegment = segment => {
  return RegExp(/^\('+[\s\S]+'\)$/).test(segment) || RegExp(/^\(+\d+\)$/).test(segment)
}

PathHelper.getSegments = path => {
  return path
    .split(/\/|[(][']|[(]/g)
    .filter(segment => segment && segment.length)
    .map(segment => {
      if (segment.endsWith("')")) {
        segment = `('${segment}`
      } else if (segment.endsWith(')')) {
        segment = `(${segment}`
      }
      return segment
    })
}

/**
 * Factory methods that creates an OData Route based on the provided parameters
 * @param options The provided Options object
 */
export const createOdataRouter: (options: RouterOptions) => RouteModel = options => {
  const collectionsWithUrls = options.collections.map(c => ({
    collection: c,
    url: PathHelper.trimSlashes(`${options.route}/${c.name}`),
  }))

  return injector => {
    const logger = injector.logger.withScope('@furystack/odata/routing')
    const msg = injector.getRequest()

    logger.verbose({
      message: `Incoming message: ${msg.url}`,
    })

    const urlPathName = PathHelper.trimSlashes(parse(decodeURI(msg.url || ''), true).pathname || '')
    const collection = collectionsWithUrls.find(c => urlPathName.indexOf(c.url) !== -1)
    const server = (msg.connection as TLSSocket).encrypted
      ? `https://${msg.headers.host}/`
      : `http://${msg.headers.host}/`

    updateContext(injector, {
      server,
      odataRoute: options.route,
      entities: options.entities,
      collections: options.collections,
    })

    injector.getInstance(ServerResponse).setHeader('OData-Version', '4.0')

    if (collection) {
      const entity = options.entities.find(e => e.model === collection.collection.model)

      if (entity) {
        const queryParams = entity && getOdataParams(msg.url, entity)
        updateContext<{ [s: string]: any }>(injector, {
          collection: collection.collection,
          context: PathHelper.joinPaths(server, options.route, `$metadata#${collection.collection.name}`),
          entity,
          queryParams,
        })
      }

      if (PathHelper.isItemPath(urlPathName)) {
        const entityRoute = getEntityRoute(injector, urlPathName, msg, entity as Entity<any>, collection.url)
        if (entityRoute) {
          return entityRoute
        }
      }

      // Collection functions
      const collectionFunction =
        collection.collection.functions &&
        collection.collection.functions.find(a => urlPathName === PathHelper.joinPaths(collection.url, a.name))
      if (msg.method === 'GET' && collectionFunction) {
        return collectionFunction.action
      }

      const collectionAction =
        collection.collection.actions &&
        collection.collection.actions.find(a => urlPathName === PathHelper.joinPaths(collection.url, a.name))
      if (msg.method === 'POST' && collectionAction) {
        return collectionAction.action
      }

      switch (msg.method) {
        case 'GET':
          return GetCollectionAction
        default:
          return PostAction
      }
    }

    // Global functions
    const globalFunction = options.globalFunctions.find(
      a => urlPathName === PathHelper.joinPaths(options.route, a.name),
    )
    if (msg.method === 'GET' && globalFunction) {
      return globalFunction.action
    }

    // Global actions
    const globalAction = options.globalActions.find(a => urlPathName === PathHelper.joinPaths(options.route, a.name))
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
