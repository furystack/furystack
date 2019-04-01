import { IRequestAction } from '@furystack/http-api'
import { Constructable } from '@furystack/inject'
import { XmlNode } from '../xml-utils'

/**
 * Interface that defines a callable OData function
 */
export interface FunctionDescriptor {
  /**
   * The HTTP Request action to be called
   */
  action: Constructable<IRequestAction>

  /**
   * The type of the return object (for building meaningful metadata)
   */
  returnType?: Constructable<any>

  /**
   * indicates if the function is bound to a collection or entity type
   */
  isBound?: boolean

  /**
   * Optional array of parameters
   */
  parameters?: Array<{ name: string; type: string; nullable?: boolean }>
}

/**
 * Converts a descriptor entry to XML node
 * @param f The descriptor to be converted
 * @param type Type (action / function)
 */
export const toXmlNode = (f: [string, FunctionDescriptor], type: 'Action' | 'Function') => {
  return {
    tagName: type,
    attributes: {
      Name: f[0],
      Function: f[1].action.name.toString(),
      ...(Object.assign({}, f[1].isBound ? { IsBound: true } : {}) as any),
    },
    children: [
      ...[
        f[1].returnType && {
          tagName: 'ReturnType',
          attributes: {
            Type: f[1].returnType.name, // ToDo: add full namespace
          },
        },
        ...[
          ...(f[1].parameters
            ? f[1].parameters.map(
                p =>
                  ({
                    tagName: 'Parameter',
                    attributes: {
                      Name: p.name,
                      Type: p.type,
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
