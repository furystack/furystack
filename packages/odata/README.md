# @furystack/odata

odata v4 implementation for FuryStack

### Usage example

You can use OData in a similar way:

```ts
class MyEntityType {
  public id!: number
  public value!: string
}

const myInjector = new Injector()

myInjector
  .useLogging()
  .useHttpApi()
  .useOdata('odata.svc', model =>
    model.addNameSpace('default', namespace =>
      namespace
        .setupEntities(e =>
          e.addEntityType({
            model: MyEntityType,
            primaryKey: 'id',
            properties: [{ property: 'id', type: EdmType.Int16 }, { property: 'value', type: EdmType.String }],
          }),
        )
        .setupCollections(collections => collections.addCollection({ model: MyEntityType, name: 'MyEntities' })),
    ),
  )
  .listenHttp()
```
