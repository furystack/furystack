import { Constructable } from '@furystack/inject'
import { CollectionBuilder } from './collection-builder'
import { EntityBuilder } from './entity-builder'
import { EdmType } from './models/edm-type'
// import { EdmType } from './models'
import { OdataGlobalAction } from './models/odata-global-action'
import { XmlNode } from './xml-utils'

/**
 * Model builder for OData endpoints
 */
export class NamespaceBuilder {
  public entities = new EntityBuilder()
  public collections = new CollectionBuilder()
  public actions: { [k: string]: Constructable<OdataGlobalAction<any, any>> } = {}
  public functions: { [k: string]: Constructable<OdataGlobalAction<any, any>> } = {}

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
                        Type: EdmType[field.type],
                      },
                    } as XmlNode),
                ),
                ...entity.relations.map(
                  relation =>
                    ({
                      tagName: 'NavigationProperty',
                      attributes: {
                        // ToDo: check this
                        Name: relation.propertyName,
                        Type: relation.relatedModel.name,
                      },
                    } as XmlNode),
                ),
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
            // Unbound functions
            ...Object.entries(this.actions).map(
              a =>
                ({
                  tagName: 'FunctionImport',
                  attributes: {
                    Name: a[0],
                    Function: a[1].name.toString(),
                  },
                } as XmlNode),
            ),
          ],
        },
      ],
    }
    return value
  }
}
