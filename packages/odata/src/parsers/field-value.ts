import { EdmType } from '../models/edm-type'
import { Entity } from '../models/entity'

export const parseFieldValue = <T>(value: string, property: string, entity: Entity<T>) => {
  if (!entity.properties.map(p => p.property).includes(property as keyof T)) {
    throw new Error(`The property '${property}' is not defined on entity '${entity.name}'`)
  }
  switch (entity.properties.find(f => f.property === property)?.type) {
    case EdmType.Int16:
    case EdmType.Int32:
      return parseInt(value, 10)
    case EdmType.Double:
      return parseFloat(value)
    default:
      return value
  }
}
