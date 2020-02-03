import { IncomingMessage } from 'http'
import { PathHelper } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { DeleteAction } from '../actions/delete'
import { GetEntityAction } from '../actions/get-entity-action'
import { NavigationPropertyAction } from '../actions/navigation-property'
import { NavigationPropertyCollectionAction } from '../actions/navigation-property-collection'
import { PatchAction } from '../actions/patch'
import { PutAction } from '../actions/put'
import { ModelBuilder } from '../model-builder'
import { Entity } from '../models/entity'
import { updateContext } from './update-context'

/**
 * Returns an available route for entities
 */
export const getEntityRoute = <T>(
  injector: Injector,
  urlPathName: string,
  msg: IncomingMessage,
  entity: Entity<T>,
  collectionUrl: string,
) => {
  const entitySegment = PathHelper.getSegments(urlPathName).filter(s => PathHelper.isItemSegment(s))[0]
  const trimmedSegment = entitySegment
    .replace(`('`, '')
    .replace(`')`, '')
    .replace('(', '')
    .replace(')', '')
  const entityId = isNaN(trimmedSegment as any) ? trimmedSegment : parseInt(trimmedSegment, 10)

  updateContext(injector, {
    entityId,
  })

  if (msg.method === 'POST') {
    const currentAction =
      entity &&
      entity.actions &&
      entity.actions.find(
        a =>
          PathHelper.joinPaths(collectionUrl + entitySegment, a.name) === urlPathName ||
          PathHelper.joinPaths(collectionUrl, entitySegment, a.name) === urlPathName,
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
          PathHelper.joinPaths(collectionUrl + entitySegment, a.name) === urlPathName ||
          PathHelper.joinPaths(collectionUrl, entitySegment, a.name) === urlPathName,
      )
    if (currentFunction) {
      return currentFunction.action
    }

    const navigationProperty =
      entity &&
      entity.navigationProperties &&
      entity.navigationProperties.find(
        a =>
          PathHelper.joinPaths(collectionUrl + entitySegment, a.propertyName) === urlPathName ||
          PathHelper.joinPaths(collectionUrl, entitySegment, a.propertyName) === urlPathName,
      )

    if (navigationProperty) {
      updateContext(injector, {
        context: PathHelper.joinPaths(
          `$metadata#${`${Array.from(injector.getInstance(ModelBuilder).namespaces.values())[0].name}.${
            navigationProperty.relatedModel.name
          }`}`,
        ),
        navigationProperty,
      })
      return NavigationPropertyAction
    }

    const navigationPropertyCollection =
      entity &&
      entity.navigationPropertyCollections &&
      entity.navigationPropertyCollections.find(
        a =>
          PathHelper.joinPaths(collectionUrl + entitySegment, a.propertyName) === urlPathName ||
          PathHelper.joinPaths(collectionUrl, entitySegment, a.propertyName) === urlPathName,
      )

    if (navigationPropertyCollection) {
      updateContext(injector, {
        context: PathHelper.joinPaths(`$metadata#${navigationPropertyCollection.dataSet}`),
        navigationPropertyCollection,
      })
      return NavigationPropertyCollectionAction
    }
  }

  switch (msg.method) {
    case 'PUT':
      return PutAction
    case 'PATCH':
      return PatchAction
    case 'DELETE':
      return DeleteAction
    default:
      return GetEntityAction
  }
}
