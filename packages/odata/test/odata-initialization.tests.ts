import { ModelBuilder, EdmType } from '../src'
import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import '@furystack/logging'
import { IsAuthenticated, LoginAction, RequestAction, JsonResult } from '@furystack/http-api'

class MockClass {
  id!: number
  value!: string
}

const MockAction: RequestAction = async i => JsonResult({ value: 'asd' })

describe('Odata', () => {
  it('Should be added to an injector', () => {
    using(new Injector(), i => {
      i.useLogging().useOdata('odata', builder => builder)
      expect(i.getInstance(ModelBuilder)).toMatchSnapshot()
    })
  })

  it('Should add a namespace', () => {
    using(new Injector(), i => {
      i.useLogging().useOdata('odata', builder => builder.addNameSpace('default', ns => ns))
      expect(i.getInstance(ModelBuilder)).toMatchSnapshot()
    })
  })

  it('Should add a namespace with global actions and functions', () => {
    using(new Injector(), i => {
      i.useLogging().useOdata('odata', builder =>
        builder.addNameSpace('default', ns => {
          {
            ns.setupGlobalFunctions([
              {
                name: 'isAuthenticated',
                action: IsAuthenticated,
              },
            ])
            ns.setupGlobalActions([{ name: 'login', action: LoginAction }])
            return ns
          }
        }),
      )
      expect(i.getInstance(ModelBuilder)).toMatchSnapshot()
    })
  })

  it('Should add a namespace and an entity type', () => {
    using(new Injector(), i => {
      i.useLogging().useOdata('odata', builder =>
        builder.addNameSpace('default', ns =>
          ns.setupEntities(e =>
            e.addEntityType({
              model: MockClass,
              primaryKey: 'id',
              properties: [
                { property: 'id', type: EdmType.Int16, nullable: false },
                { property: 'value', type: EdmType.String },
              ],
            }),
          ),
        ),
      )
      expect(i.getInstance(ModelBuilder)).toMatchSnapshot()
    })
  })

  it('Should add a namespace, an entity type and a collection', () => {
    using(new Injector(), i => {
      i.useLogging().useOdata('odata', builder =>
        builder.addNameSpace('default', ns =>
          ns
            .setupEntities(e =>
              e.addEntityType({
                model: MockClass,
                primaryKey: 'id',
                properties: [
                  { property: 'id', type: EdmType.Int16, nullable: false },
                  { property: 'value', type: EdmType.String },
                ],
              }),
            )
            .setupCollections(c =>
              c.addCollection({
                model: MockClass,
                name: 'mockClassEntities',
              }),
            ),
        ),
      )
      expect(i.getInstance(ModelBuilder)).toMatchSnapshot()
    })
  })
  it('Should match a complex snapshot and an XML node', () => {
    using(new Injector(), i => {
      i.useLogging().useOdata('odata', builder =>
        builder.addNameSpace('default', ns => {
          ns.setupEntities(e =>
            e.addEntityType({
              model: MockClass,
              primaryKey: 'id',
              properties: [
                { property: 'id', type: EdmType.Int16, nullable: false },
                { property: 'value', type: EdmType.String },
              ],
              actions: [
                {
                  name: 'mockAction1',
                  action: MockAction,
                  isBound: true,
                  parameters: [{ name: 'id', type: EdmType.Int16 }],
                },
              ],
              functions: [
                {
                  name: 'mockFunction1',
                  action: MockAction,
                  returnType: MockClass,
                },
              ],
            }),
          ).setupCollections(c =>
            c.addCollection({
              model: MockClass,
              name: 'mockClassEntities',
              actions: [
                {
                  name: 'mockAction1',
                  action: MockAction,
                  isBound: true,
                  parameters: [{ name: 'id', type: EdmType.Int16 }],
                },
              ],
              functions: [
                {
                  name: 'mockFunction1',
                  action: MockAction,
                  returnType: MockClass,
                },
              ],
            }),
          )
          ns.setupGlobalFunctions([
            {
              name: 'isAuthenticated',
              action: IsAuthenticated,
            },
          ])
          ns.setupGlobalActions([{ name: 'login', action: LoginAction }])

          return ns
        }),
      )
      expect(i.getInstance(ModelBuilder)).toMatchSnapshot('ModelBuilder')
      expect(i.getInstance(ModelBuilder).toXmlNode()).toMatchSnapshot('ModelBuilder XML Node')
    })
  })
})
