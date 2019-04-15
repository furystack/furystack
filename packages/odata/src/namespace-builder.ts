import { CollectionBuilder } from './collection-builder'
import { EntityTypeBuilder } from './entity-type-builder'
import { EdmType } from './models/edm-type'
import { FunctionDescriptor, toXmlNode } from './models/function-descriptor'
import { XmlNode } from './xml-utils'

/**
 * Model builder for OData endpoints
 */
export class NamespaceBuilder {
  public entities = new EntityTypeBuilder()
  public collections = new CollectionBuilder()
  public actions: FunctionDescriptor[] = []
  public functions: FunctionDescriptor[] = []

  public setupEntities(buildEntities: (e: EntityTypeBuilder) => EntityTypeBuilder) {
    this.entities = buildEntities(this.entities)
    return this
  }

  public setupCollections<T>(buildCollection: (builder: CollectionBuilder) => CollectionBuilder) {
    this.collections = buildCollection(this.collections)
    return this
  }

  public setupGlobalActions(actions: this['actions']) {
    return (this.actions = actions)
  }

  public setupGlobalFunctions(functions: this['functions']) {
    return (this.functions = functions)
  }

  constructor(public readonly name: string) {}

  public toXmlNode(): XmlNode {
    const value: XmlNode = {
      tagName: 'Schema',
      attributes: {
        xmlns: 'http://docs.oasis-open.org/odata/ns/edm',
        Namespace: this.name,
      },
      children: [
        ...Array.from(this.entities.entities.values()).map(
          entity =>
            ({
              tagName: 'EntityType',
              attributes: {
                Name: entity.name || entity.model.name,
              },
              children: [
                {
                  tagName: 'Key',
                  children: [
                    {
                      tagName: 'PropertyRef',
                      attributes: {
                        Name: entity.primaryKey.toString(),
                      },
                    },
                  ],
                },
                ...entity.properties.map(
                  field =>
                    ({
                      tagName: 'Property',
                      attributes: {
                        // ToDo: min, max, etc...
                        Name: field.property,
                        Type: `Edm.${EdmType[field.type]}`,
                        ...(field.property === entity.primaryKey ? { Nullable: 'false' } : {}),
                        ...(field.nullable !== undefined ? { Nullable: field.nullable.toString() } : {}),
                      },
                    } as XmlNode),
                ),
                ...(entity.navigationProperties
                  ? entity.navigationProperties.map(
                      relation =>
                        ({
                          tagName: 'NavigationProperty',
                          attributes: {
                            Name: relation.propertyName,
                            Type: `${this.name}.${relation.relatedModel.name}`,
                          },
                        } as XmlNode),
                    )
                  : []),
                ...(entity.navigationPropertyCollections
                  ? entity.navigationPropertyCollections.map(
                      relation =>
                        ({
                          tagName: 'NavigationProperty',
                          attributes: {
                            Name: relation.propertyName,
                            Type: `Collection(${this.name}.${relation.relatedModel.name})`,
                          },
                        } as XmlNode),
                    )
                  : []),
              ],
            } as XmlNode),
        ),
        {
          tagName: 'EntityContainer',
          attributes: {
            Name: 'DefaultContainer',
            // 'xmlns:p4': 'http://schemas.microsoft.com/ado/2009/02/edm/annotation',
            // 'p4:LazyLoadingEnabled': 'true',
          },
          children: [
            ...Array.from(this.collections.collections.values()).map(
              collection =>
                ({
                  tagName: 'EntitySet',
                  attributes: {
                    Name: collection.name,
                    EntityType: `${this.name}.${collection.model.name}`,
                  },
                } as XmlNode),
            ),
          ],
        },
        // Unbound functions and actions
        ...this.actions.map(a => toXmlNode(a, this.name, 'Action')),
        ...this.functions.map(f => toXmlNode(f, this.name, 'Function')),

        // Collection bound functions and actions
        ...Array.from(this.collections.collections).flatMap(c => [
          ...Object.entries(c[1].actions || {}).map(a => {
            const descriptor = { ...a[1] }
            descriptor.isBound = true
            descriptor.parameters = [
              ...(descriptor.parameters || []),
              { name: 'bindingParameter', type: `Collection(${this.name}.${c[1].model.name})` },
            ]
            return toXmlNode(descriptor, this.name, 'Action')
          }),
          ...Object.entries(c[1].functions || {}).map(a => {
            const descriptor = { ...a[1] }
            descriptor.isBound = true
            descriptor.parameters = [
              ...(descriptor.parameters || []),
              { name: 'bindingParameter', type: `Collection(${this.name}.${c[1].model.name})` },
            ]
            return toXmlNode(descriptor, this.name, 'Function')
          }),
        ]),
        ...Array.from(this.entities.entities.values()).flatMap(entity => {
          return [
            ...(entity.actions
              ? entity.actions.map(e => {
                  const descriptor = { ...e }
                  descriptor.isBound = true
                  descriptor.parameters = [
                    ...(descriptor.parameters || []),
                    { name: 'bindingParameter', type: `${this.name}.${entity.model.name}` },
                  ]
                  return toXmlNode(descriptor, this.name, 'Action')
                })
              : []),
            ...(entity.functions
              ? entity.functions.map(e => {
                  const descriptor = { ...e }
                  descriptor.isBound = true
                  descriptor.parameters = [
                    ...(descriptor.parameters || []),
                    { name: 'bindingParameter', type: `${this.name}.${entity.model.name}` },
                  ]
                  return toXmlNode(descriptor, this.name, 'Function')
                })
              : []),
          ]
        }),
      ],
    }
    return value
  }
}
