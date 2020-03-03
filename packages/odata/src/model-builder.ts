import { Injectable } from '@furystack/inject'
import { NamespaceBuilder } from './namespace-builder'
import { XmlNode } from './xml-utils'

/**
 * Model builder for OData endpoints
 */
@Injectable({ lifetime: 'singleton' })
export class ModelBuilder {
  public namespaces: Map<string, NamespaceBuilder> = new Map()

  /**
   * Adds a new Namespace to the OData Endpoint
   * Usage example:
   * ````ts
   * myInjector
   *  .useOdata('odata', builder =>
   *    builder.addNamespace('myNamespace', namespaceBuilder =>
   *      namespaceBuilder.setupEntities(...) ))
   * ````
   *
   * @param name Name of the namespace
   * @param buildNamespace The Namespace Builder factory method
   * @returns the builder instance for chaining
   */
  public addNameSpace(name: string, buildNamespace: (n: NamespaceBuilder) => NamespaceBuilder) {
    const ns = new NamespaceBuilder(name)
    this.namespaces.set(name, buildNamespace(ns))
    return this
  }

  /**
   * @returns the current builder data in XML format
   */
  public toXmlNode() {
    const children = Array.from(this.namespaces.values()).map(v => v.toXmlNode())
    const value: XmlNode = {
      tagName: 'edmx:Edmx',
      attributes: {
        Version: '4.0',
        'xmlns:edmx': 'http://docs.oasis-open.org/odata/ns/edmx',
      },
      children: [
        {
          tagName: 'edmx:DataServices',
          children,
        },
      ],
    }
    return value
  }
}
