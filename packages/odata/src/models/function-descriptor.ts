import { IRequestAction } from '@furystack/http-api'
import { Constructable } from '@furystack/inject'
import { XmlNode } from '../xml-utils'
import { EdmType } from './edm-type'

/**
 * Interface that defines a callable OData function
 */
export interface FunctionDescriptor {
  /**
   * Unique name for the action.
   */
  name: string

  /**
   * The HTTP Request action to be called
   */
  action: Constructable<IRequestAction>

  /**
   * The type of the return object (for building meaningful metadata)
   */
  returnType?: Constructable<any> | EdmType

  /**
   * indicates if the function is bound to a collection or entity type
   */
  isBound?: boolean

  /**
   * Optional array of parameters
   */
  parameters?: Array<{ name: string; type: EdmType | string; nullable?: boolean }>
}

/**
 * Converts a descriptor entry to XML node
 * @param f The descriptor to be converted
 * @param type Type (action / function)
 */
export const toXmlNode = (descriptor: FunctionDescriptor, namespace: string, type: 'Action' | 'Function') => {
  return {
    tagName: type,
    attributes: {
      Name: descriptor.name,
      // Function: f[1].action.name.toString(),
      ...(Object.assign({}, descriptor.isBound ? { IsBound: true } : {}) as any),
    },
    children: [
      ...[
        descriptor.returnType && {
          tagName: 'ReturnType',
          attributes: {
            Type: (descriptor.returnType as Constructable<any>).name
              ? `${namespace}.${(descriptor.returnType as Constructable<any>).name}`
              : `Edm.${EdmType[descriptor.returnType as EdmType]}`,
          },
        },
        ...[
          ...(descriptor.parameters
            ? descriptor.parameters.map(
                p =>
                  ({
                    tagName: 'Parameter',
                    attributes: {
                      Name: p.name,
                      Type: typeof p.type === 'string' ? p.type : `Edm.${EdmType[p.type]}`,
                      ...(p.nullable ? { Nullable: p.nullable.toString() } : {}),
                    },
                  } as XmlNode),
              )
            : []),
        ],
      ],
    ].filter(el => el !== undefined),
  } as XmlNode
}
