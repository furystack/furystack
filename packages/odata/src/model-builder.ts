import { Injectable } from '@furystack/inject'
import { NamespaceBuilder } from './namespace-builder'
import { XmlNode } from './xml-utils'

/**
 * Model builder for OData endpoints
 */
@Injectable({ lifetime: 'singleton' })
export class ModelBuilder {
  public namespaces: Map<string, NamespaceBuilder> = new Map()

  public addNameSpace(name: string, buildNamespace: (n: NamespaceBuilder) => NamespaceBuilder) {
    const ns = new NamespaceBuilder(name)
    this.namespaces.set(name, buildNamespace(ns))
    return this
  }

  public toXmlNode() {
    const children = Array.from(this.namespaces.values()).map(v => v.toXmlNode())
    const value: XmlNode = {
      tagName: 'edmx:Edmx',
      attributes: {
        'xmlns:edmx': 'http://docs.oasis-open.org/odata/ns/edmx',
        Version: '4.0',
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
