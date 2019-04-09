import { CollectionBuilder } from './collection-builder'
import { EntityBuilder } from './entity-builder'
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
                ...entity.fields.map(
                  field =>
                    ({
                      tagName: 'Property',
                      attributes: {
                        // ToDo: min, max, etc...
                        Name: field.property,
                        Type: `Edm.${EdmType[field.type]}`,
                      },
                    } as XmlNode),
                ),
                ...(entity.relations
                  ? entity.relations.map(
                      relation =>
                        ({
                          tagName: 'NavigationProperty',
                          attributes: {
                            // ToDo: check this
                            Name: relation.propertyName,
                            Type: relation.relatedModel.name,
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
            Name: this.name, // ???
          },
          children: [
            ...Array.from(this.collections.collections.values()).map(
              collection =>
                ({
                  tagName: 'EntitySet',
                  attributes: {
                    Name: collection.name,
                    EntityType: collection.model.name,
                  },
                } as XmlNode),
            ),
            // Unbound functions and actions
            ...Object.entries(this.actions).map(a => toXmlNode(a, 'Action')),
            ...Object.entries(this.functions).map(f => toXmlNode(f, 'Function')),

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
                          { name: 'bindingParameter', type: `Collection(${c[1].model.name})` },
                        ],
                      },
                    },
                  ],
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
                          { name: 'bindingParameter', type: `Collection(${c[1].model.name})` },
                        ],
                      },
                    },
                  ],
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
                                { name: 'bindingParameter', type: entity.model.name },
                              ],
                            },
                          },
                        ],
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
                                { name: 'bindingParameter', type: entity.model.name },
                              ],
                            },
                          },
                        ],
                        'Function',
                      ),
                    )
                  : []),
              ]
            }),
          ],
        },
      ],
    }
    return value
  }
}
