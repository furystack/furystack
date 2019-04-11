import { CollectionBuilder } from './collection-builder'
import { EntityBuilder } from './entity-builder'
import { NavigationPropertyCollection } from './models'
import { EdmType } from './models/edm-type'
import { FunctionDescriptor, toXmlNode } from './models/function-descriptor'
import { XmlNode } from './xml-utils'

/**
 * Model builder for OData endpoints
 */
export class NamespaceBuilder {
  public entities = new EntityBuilder()
  public collections = new CollectionBuilder()
  public actions: { [k: string]: FunctionDescriptor } = {}
  public functions: { [k: string]: FunctionDescriptor } = {}

  public setupEntities(buildEntities: (e: EntityBuilder) => EntityBuilder) {
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
                        // ToDo: add nullable to others
                        ...(field.property === entity.primaryKey ? { Nullable: 'false' } : {}),
                      },
                    } as XmlNode),
                ),
                ...(entity.navigationProperties
                  ? entity.navigationProperties.map(
                      relation =>
                        ({
                          tagName: 'NavigationProperty',
                          attributes: {
                            // ToDo: check this
                            Name: relation.propertyName,
                            Type: (relation as NavigationPropertyCollection<any>).getRelatedEntities
                              ? `Collection(${this.name}.${relation.relatedModel.name})`
                              : `${this.name}.${relation.relatedModel.name}`,
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
        ...Object.entries(this.actions).map(a => toXmlNode(a, this.name, 'Action')),
        ...Object.entries(this.functions).map(f => toXmlNode(f, this.name, 'Function')),

        // Collection bound functions and actions
        ...Array.from(this.collections.collections).flatMap(c => [
          ...Object.entries(c[1].actions || {}).map(a =>
            toXmlNode(
              [
                a[0],
                {
                  ...a[1],
                  ...{
                    isBound: true,
                    parameters: [
                      ...(a[1].parameters || []),
                      { name: 'bindingParameter', type: `Collection(${this.name}.${c[1].model.name})` },
                    ],
                  },
                },
              ],
              this.name,
              'Action',
            ),
          ),
          ...Object.entries(c[1].functions || {}).map(a =>
            toXmlNode(
              [
                a[0],
                {
                  ...a[1],
                  ...{
                    isBound: true,
                    parameters: [
                      ...(a[1].parameters || []),
                      { name: 'bindingParameter', type: `Collection(${this.name}.${c[1].model.name})` },
                    ],
                  },
                },
              ],
              this.name,
              'Function',
            ),
          ),
        ]),
        ...Array.from(this.entities.entities.values()).flatMap(entity => {
          return [
            ...(entity.actions
              ? Object.entries(entity.actions).map(e =>
                  toXmlNode(
                    [
                      e[0],
                      {
                        ...e[1],
                        ...{
                          isBound: true,
                          parameters: [
                            ...(e[1].parameters || []),
                            { name: 'bindingParameter', type: `${this.name}.${entity.model.name}` },
                          ],
                        },
                      },
                    ],
                    this.name,
                    'Action',
                  ),
                )
              : []),
            ...(entity.functions
              ? Object.entries(entity.functions).map(e =>
                  toXmlNode(
                    [
                      e[0],
                      {
                        ...e[1],
                        ...{
                          isBound: true,
                          parameters: [
                            ...(e[1].parameters || []),
                            { name: 'bindingParameter', type: `${this.name}.${entity.model.name}` },
                          ],
                        },
                      },
                    ],
                    this.name,
                    'Function',
                  ),
                )
              : []),
          ]
        }),
      ],
    }
    return value
  }
}
