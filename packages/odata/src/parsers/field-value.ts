import { EdmType } from '../models/edm-type'
import { Entity } from '../models/entity'

export const parseFieldValue = <T>(value: string, property: string, entity: Entity<T>) => {
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
