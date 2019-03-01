import { HttpApiSettings } from '@furystack/http-api'
import { Injector } from '@furystack/inject/dist/Injector'
import { PathHelper } from '@sensenet/client-utils'
import { parse } from 'url'
import { GetCollectionAction } from './actions/get-collection-action'
import { MetadataAction } from './actions/metadata-action'
import { RootAction } from './actions/root-action'
import { ModelBuilder } from './model-builder'
import { PostAction } from './actions/post'
import { PutAction } from './actions/put'
import { PatchAction } from './actions/patch'
import { DeleteAction } from './actions/delete'
import { GetEntityAction } from './actions/get-entity-action'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    useOdata: (route: string, buildModel: (builder: ModelBuilder) => ModelBuilder) => this
  }
}

Injector.prototype.useOdata = function(route, buildModel) {
  const instance = buildModel(new ModelBuilder())
  this.setExplicitInstance(instance)

  const collections = Array.from(instance.namespaces.values())
    .map(ns => ns.collections.collections.values())
    .map(c => Array.from(c))
    .flat()

  const collectionUrls = collections.map(c => PathHelper.trimSlashes(`${route}/${c.name}`))

  this.getInstance(HttpApiSettings).actions.push(msg => {
    // ToDo: Create an OData context here (current collection, entity, action, etc...)
    const urlPathName = PathHelper.trimSlashes(parse(decodeURI(msg.url || ''), true).pathname || '')

    if (collectionUrls.findIndex(curl => urlPathName.indexOf(curl) !== -1) !== -1) {
      if (collectionUrls.includes(urlPathName)) {
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

    if (msg.method === 'GET' && urlPathName === `${route}/$metadata`) {
      return MetadataAction
    }

    if (urlPathName.indexOf(route) === 0) {
      return RootAction
    }
  })
  return this
}
