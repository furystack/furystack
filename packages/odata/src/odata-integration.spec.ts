import { Injector } from '@furystack/inject'
import { InMemoryStore, StoreManager } from '@furystack/core'
import got from 'got'
import { JsonResult } from '@furystack/http-api'
import { PathHelper } from '@furystack/utils'
import { EdmType } from './models/edm-type'
import './injector-extension'

const port = 8888
const odataRouteName = `api/odata-test`
const odataPath = PathHelper.joinPaths(`http://localhost:${port}/`, odataRouteName)

describe('OData Integration Tests', () => {
  class User {
    id!: number
    age!: number
    height?: number
    name!: string
  }

  const userList = [
    { id: 1, age: 123, name: 'asdf', height: 0.3 },
    { id: 2, age: 123, name: 'sdf', height: 0.3 },
    { id: 3, age: 456, name: 'asdf', height: 0.2 },
    { id: 4, age: 678, name: 'o8ugzsdgf' },
  ]

  class Group {
    id!: number
    name!: string
    memberIds!: number[]
    ownerId!: number
  }

  const groupList: Group[] = [
    { id: 1, name: 'all users', memberIds: [1, 2, 3, 4], ownerId: 4 },
    { id: 2, name: 'admins', memberIds: [1], ownerId: 1 },
  ]

  class Entity2 {
    guid!: string
    booleanValue?: boolean
    complexValue!: { foo: string; bar: string }
    entity1Id!: number
  }

  const testEntity2List = [
    { guid: 'asdf', entity1Id: 1, booleanValue: true, complexValue: { foo: '', bar: '' } },
    {
      guid: 'sdfg',
      entity1Id: 2,
      booleanValue: true,
      complexValue: { foo: 'f', bar: 'b' },
    },
    { guid: 'fghj', entity1Id: 3, booleanValue: false, complexValue: { foo: 'bar', bar: 'foo' } },
    { guid: 'hjkl', entity1Id: 4, complexValue: { foo: 'asdf', bar: 'asdf' } },
  ]

  const i = new Injector()
  beforeAll(async () => {
    i.setupStores(sm =>
      sm
        .addStore(new InMemoryStore({ model: User, primaryKey: 'id' }))
        .addStore(new InMemoryStore({ model: Group, primaryKey: 'id' }))
        .addStore(new InMemoryStore({ model: Entity2, primaryKey: 'guid' })),
    )
      .setupRepository(repo =>
        repo
          .createDataSet(User, { name: 'UserCollection' })
          .createDataSet(Group, { name: 'GroupCollection' })
          .createDataSet(Entity2, { name: 'Entity2Collection' }),
      )
      .useOdata(odataRouteName, odata =>
        odata.addNameSpace('default', ns => {
          ns.setupEntities(entities =>
            entities
              .addEntityType({
                model: User,
                primaryKey: 'id',
                properties: [
                  { property: 'id', type: EdmType.Int16, nullable: false },
                  { property: 'age', type: EdmType.Int16, nullable: false },
                  { property: 'name', type: EdmType.String },
                  { property: 'height', type: EdmType.Double },
                ],
                navigationProperties: [
                  {
                    propertyName: 'MyEntity2',
                    dataSet: 'Entity2Collection',
                    relatedModel: Entity2,
                    getRelatedEntity: async (entity, dataset, injector, filter) => {
                      const related = await dataset.filter(injector, {
                        ...filter,
                        filter: { ...filter.filter, entity1Id: entity.id },
                        top: 1,
                      })
                      return related[0] || null
                    },
                  },
                ],
                actions: [{ name: 'userAction', action: async () => JsonResult({ value: 'userAction' }) }],
                functions: [{ name: 'userFunction', action: async () => JsonResult({ value: 'userFunction' }) }],
              })
              .addEntityType({
                model: Group,
                primaryKey: 'id',
                name: 'GroupCollection',
                properties: [
                  { property: 'id', type: EdmType.Int16, nullable: false },
                  { property: 'name', nullable: false, type: EdmType.String },
                ],
                navigationProperties: [
                  {
                    dataSet: 'UserCollection',
                    relatedModel: User,
                    propertyName: 'owner',
                    getRelatedEntity: async (entity, dataSet, injector, filter) => {
                      if (!entity.ownerId) {
                        return null
                      }
                      const owner = await dataSet.filter(injector, {
                        ...filter,
                        top: 1,
                        filter: {
                          ...filter.filter,
                          id: entity.ownerId,
                        },
                      })
                      return owner[0] || null
                    },
                  },
                ],
                navigationPropertyCollections: [
                  {
                    dataSet: 'UserCollection',
                    relatedModel: User,
                    propertyName: 'members',
                    getRelatedEntities: async (entity, dataSet, injector, filter) => {
                      const members = await dataSet.filter(injector, {
                        ...filter,
                        filter: {
                          ...filter.filter,
                          id: { $in: entity.memberIds },
                        },
                      })
                      return [...members]
                    },
                  },
                ],
              })
              .addEntityType({
                model: Entity2,
                primaryKey: 'guid',
                properties: [
                  {
                    property: 'guid',
                    type: EdmType.Guid,
                    nullable: false,
                  },
                  {
                    property: 'booleanValue',
                    type: EdmType.Boolean,
                  },
                  {
                    property: 'complexValue',
                    type: EdmType.Unknown,
                    nullable: false,
                  },
                ],
              }),
          )
          ns.setupCollections(collections =>
            collections
              .addCollection({
                model: User,
                name: 'UserCollection',
                actions: [
                  {
                    name: 'entity1CustomAction',
                    action: async () => JsonResult({ result: 'CollectionCustomActionResult' }),
                  },
                ],
                functions: [
                  {
                    name: 'entity1CustomFunction',
                    action: async () => JsonResult({ result: 'CollectionCustomFunctionResult' }),
                  },
                ],
              })
              .addCollection({
                model: Entity2,
                name: 'Entity2Collection',
                actions: [
                  { name: 'entity2CustomAction', action: async () => JsonResult({ result: 'CustomActionResult' }) },
                ],
                functions: [
                  { name: 'entity2CustomFunction', action: async () => JsonResult({ result: 'CustomFunctionResult' }) },
                ],
              })
              .addCollection({
                model: Group,
                name: 'GroupCollection',
              }),
          )
          ns.setupGlobalActions([
            { name: 'globalAction1', action: async () => JsonResult({ result: 'GlobalCustomActionResult' }) },
          ])
          ns.setupGlobalFunctions([
            { name: 'globalFunction1', action: async () => JsonResult({ result: 'GlobalCustomFunctionResult' }) },
          ])
          return ns
        }),
      )
      .listenHttp({ port: 8888 })

    const entity1store = i.getDataSetFor<User>('UserCollection')

    for (const testEntity1 of userList) {
      await entity1store.add(i, testEntity1)
    }

    const entity2store = i.getDataSetFor<Entity2>('Entity2Collection')

    for (const tetstEntiy2 of testEntity2List) {
      await entity2store.add(i, tetstEntiy2)
    }

    const groupStore = i.getDataSetFor<Group>('GroupCollection')
    for (const group of groupList) {
      await groupStore.add(i, group)
    }
  })

  describe('Metadata', () => {
    it('Root should match the snapshot', async () => {
      const rootResponse = await got(odataPath)
      expect(JSON.parse(rootResponse.body)).toMatchSnapshot()
    })

    it('Should have metadata', async () => {
      const metadataXML = await got(PathHelper.joinPaths(odataPath, '$metadata'))
      expect(metadataXML.body).toMatchSnapshot()
    })
  })

  describe('Collection tests', () => {
    it('Retrieve a plain collection', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `UserCollection`))
      const body = JSON.parse(response.body)
      expect(body['@odata.context']).toBe(`${odataRouteName}/$metadata#UserCollection`)
      expect(body['@odata.count']).toBe(4)
      expect(body.value.length).toBe(4)
      for (const testEntity of userList) {
        const test = {
          ...testEntity,
          '@odata.id': PathHelper.joinPaths(odataPath, `UserCollection/(${testEntity.id})`),
        }
        expect(body.value).toContainEqual(test)
      }
    })

    it('Retrieve from collection with a $select=id,name filter', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `UserCollection?$select=id,name`))
      const body = JSON.parse(response.body)
      expect(body['@odata.context']).toBe(`${odataRouteName}/$metadata#UserCollection`)
      expect(body['@odata.count']).toBe(4)
      expect(body.value.length).toBe(4)
      for (const testEntity of userList) {
        const test = {
          id: testEntity.id,
          name: testEntity.name,
          '@odata.id': PathHelper.joinPaths(odataPath, `UserCollection/(${testEntity.id})`),
        }
        expect(body.value).toContainEqual(test)
      }
    })

    it('Retrieve from collection with a $top=2 filter', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `UserCollection?$top=2`))
      const body = JSON.parse(response.body)
      expect(body.value.length).toEqual(2)
      expect(body.value.map((v: User) => v.id)).toEqual([1, 2])
    })

    it('Retrieve from collection with a $skip=2 filter', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `UserCollection?$skip=2`))
      const body = JSON.parse(response.body)
      expect(body.value.length).toEqual(2)
      expect(body.value.map((v: User) => v.id)).toEqual([3, 4])
    })
    it('Retrieve from collection with a "$filter=name eq asdf" filter on strings', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection?$filter=${encodeURIComponent('name eq asdf')}`),
      )
      const body = JSON.parse(response.body)
      for (const value of body.value.map((v: User) => v.name)) {
        expect(value).toBe('asdf')
      }
    })

    it('Retrieve from collection with a "$filter=age eq 123" filter (ints)', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection?$filter=${encodeURIComponent('age eq 123')}`),
      )
      const body = JSON.parse(response.body)
      for (const value of body.value.map((v: User) => v.age)) {
        expect(value).toBe(123)
      }
    })

    it('Retrieve from collection with "$filter=height eq 0.3" filter (floats)', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection?$filter=${encodeURIComponent('height eq 0.3')}`),
      )
      const body = JSON.parse(response.body)
      for (const value of body.value.map((v: User) => v.height)) {
        expect(value).toEqual(0.3)
      }
    })

    it('Retrieve from collection with a $orderby param (fall back to ASC)', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `UserCollection?$orderby=height`))
      const body = JSON.parse(response.body)
      expect(body.value.map((v: User) => v.height)).toEqual([0.2, 0.3, 0.3, undefined])
    })

    it('Retrieve from collection with a $orderby ASC param', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection?$orderby=${encodeURIComponent('height ASC')}`),
      )
      const body = JSON.parse(response.body)
      expect(body.value.map((v: User) => v.height)).toEqual([0.2, 0.3, 0.3, undefined])
    })

    it('Retrieve entities from collection with a $orderby DESC param', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection?$orderby=${encodeURIComponent('height DESC')}`),
      )
      const body = JSON.parse(response.body)
      expect(body.value.map((v: User) => v.height)).toEqual([0.3, 0.3, 0.2, undefined])
    })

    it('Retrieve entities from collection (Entity2)', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `Entity2Collection/`))
      const body = JSON.parse(response.body)
      expect(body['@odata.context']).toBe(`${odataRouteName}/$metadata#Entity2Collection`)
      expect(body['@odata.count']).toBe(4)
      expect(body.value.length).toBe(4)
      for (const testEntity of testEntity2List) {
        const test = {
          guid: testEntity.guid,
          booleanValue: testEntity.booleanValue,
          complexValue: testEntity.complexValue,
          '@odata.id': PathHelper.joinPaths(odataPath, `Entity2Collection/('${testEntity.guid}')`),
        }
        expect(body.value).toContainEqual(test)
      }
    })
  })

  describe('Navigation properties', () => {
    it('Retrieve entities from collection (Entity1) with a $expand=MyEntity2', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'UserCollection?$expand=MyEntity2'))
      const body = JSON.parse(response.body)
      expect(body['@odata.context']).toBe(`${odataRouteName}/$metadata#UserCollection`)
      expect(body['@odata.count']).toBe(4)
      expect(body.value.length).toBe(4)
      for (const testEntity of userList) {
        const { ...relatedT2 } = testEntity2List.find(t2 => t2.entity1Id === testEntity.id)
        delete relatedT2.entity1Id
        const test = {
          ...testEntity,
          MyEntity2: {
            ...relatedT2,
            '@odata.id': PathHelper.joinPaths(odataPath, `Entity2Collection/('${relatedT2?.guid}')`),
          },
          '@odata.id': PathHelper.joinPaths(odataPath, `UserCollection/(${testEntity.id})`),
        }
        expect(body.value).toContainEqual(test)
      }
    })

    it('Retrieve entities from collection (Entity1) with a $expand=MyEntity2&select=id,MyEntity2', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection?$expand=MyEntity2&$select=id,MyEntity2`),
      )
      const body = JSON.parse(response.body)
      expect(body['@odata.context']).toBe(`${odataRouteName}/$metadata#UserCollection`)
      expect(body['@odata.count']).toBe(4)
      expect(body.value.length).toBe(4)
      for (const testEntity of userList) {
        const { ...relatedT2 } = testEntity2List.find(t2 => t2.entity1Id === testEntity.id)
        delete relatedT2.entity1Id
        const test = {
          id: testEntity.id,
          MyEntity2: {
            ...relatedT2,
            '@odata.id': PathHelper.joinPaths(odataPath, `Entity2Collection/('${relatedT2?.guid}')`),
          },
          '@odata.id': PathHelper.joinPaths(odataPath, `UserCollection/(${testEntity.id})`),
        }
        expect(body.value).toContainEqual(test)
      }
    })

    it('Retrieve referenced entity through a navigation path ', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `UserCollection(1)/MyEntity2`))
      const body = JSON.parse(response.body)
      const entity = testEntity2List[0]
      expect(body).toStrictEqual({
        '@odata.context': '$metadata#default.Entity2',
        '@odata.id': PathHelper.joinPaths(odataPath, `Entity2Collection/('${entity.guid}')`),
        guid: entity.guid,
        complexValue: entity.complexValue,
        booleanValue: entity.booleanValue,
      })
    })

    it('Retrieve referenced entity through a navigation path and $select ', async () => {
      const response = await got(
        PathHelper.joinPaths(odataPath, `UserCollection(1)/MyEntity2?$select=guid,booleanValue`),
      )
      const body = JSON.parse(response.body)
      const entity = testEntity2List[0]
      expect(body).toStrictEqual({
        '@odata.context': '$metadata#default.Entity2',
        '@odata.id': PathHelper.joinPaths(odataPath, `Entity2Collection/('${entity.guid}')`),
        guid: entity.guid,
        booleanValue: entity.booleanValue,
      })
    })

    it('Retrieve the members from a Group entity', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'GroupCollection(1)/members'))
      const groups = JSON.parse(response.body)
      expect(groups['@odata.context']).toBe('$metadata#UserCollection')
      expect(groups['@odata.count']).toBe(4)
      expect(groups.value.map((g: Group) => g.id)).toStrictEqual([1, 2, 3, 4])
    })

    it('Retrieve the owner from a Group entity', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'GroupCollection(1)/owner'))
      const owner = JSON.parse(response.body)
      expect(owner['@odata.context']).toBe('$metadata#default.User')
      expect(owner.id).toBe(4)
    })

    it('Expand a navigation property on a navigation property by path', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'GroupCollection(1)/owner/?$expand=MyEntity2'))
      const body = JSON.parse(response.body)
      const entity = testEntity2List[3]
      expect(body.MyEntity2).toStrictEqual({
        '@odata.id': PathHelper.joinPaths(odataPath, `Entity2Collection/('${entity.guid}')`),
        guid: entity.guid,
        complexValue: entity.complexValue,
      })
    })
  })

  describe('Generic CRUD methods', () => {
    it('POST/PATCH/DELETE walkthrough', async () => {
      const store: InMemoryStore<Entity2> = i.getInstance(StoreManager).getStoreFor(Entity2)

      const entityToPost = {
        guid: 'PostResponse1',
        complexValue: { bar: '', foo: '' },
      } as Entity2
      const response = await got(PathHelper.joinPaths(odataPath, `Entity2Collection`), {
        method: 'POST',
        body: JSON.stringify(entityToPost),
      })
      const responseBody = JSON.parse(response.body)
      expect(response.statusCode).toBe(201)
      expect(responseBody).toStrictEqual({
        ['@odata.id']: PathHelper.joinPaths(odataPath, 'Entity2Collection', `('${entityToPost.guid}')`),
        ...entityToPost,
      })
      expect(store.cache.has(entityToPost.guid)).toBe(true)

      const patchResponse = await got(
        PathHelper.joinPaths(odataPath, `Entity2Collection`, `('${entityToPost.guid}')`),
        {
          method: 'PATCH',
          body: JSON.stringify({ complexValue: { foo: 'foo', bar: 'bar' } }),
        },
      )
      expect(store.cache.get(entityToPost.guid)?.complexValue.foo).toBe('foo')
      expect(patchResponse.statusCode).toBe(204)
      await got(responseBody['@odata.id'], { method: 'DELETE' })
      expect(store.cache.has(entityToPost.guid)).toBe(false)
    })
  })

  describe('Custom actions and functions', () => {
    it('Should exec a global custom action', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `globalAction1`), { method: 'POST' })
      expect(JSON.parse(response.body)).toStrictEqual({ result: 'GlobalCustomActionResult' })
    })

    it('Should exec a global custom function', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, `globalFunction1`))
      expect(JSON.parse(response.body)).toStrictEqual({ result: 'GlobalCustomFunctionResult' })
    })

    it('Should exec a collection custom action', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'UserCollection', `entity1CustomAction`), {
        method: 'POST',
      })
      expect(JSON.parse(response.body)).toStrictEqual({ result: 'CollectionCustomActionResult' })
    })

    it('Should exec a collection custom function', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'UserCollection', `entity1CustomFunction`))
      expect(JSON.parse(response.body)).toStrictEqual({ result: 'CollectionCustomFunctionResult' })
    })

    it('Should exec an entity custom action', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'UserCollection', '(1)', `userAction`), {
        method: 'POST',
      })
      expect(JSON.parse(response.body)).toStrictEqual({ value: 'userAction' })
    })

    it('Should exec an entity custom function', async () => {
      const response = await got(PathHelper.joinPaths(odataPath, 'UserCollection', '(1)', `userFunction`))
      expect(JSON.parse(response.body)).toStrictEqual({ value: 'userFunction' })
    })
  })

  afterAll(async () => {
    await i.dispose()
  })
})
