import { parseFieldValue } from './field-value'
import { Entity } from '../models/entity'
import { EdmType } from '../models'

describe('FieldValue', () => {
  it('Should return unparsed by default', () => {
    const value = 'defaultValue'
    const parsed = parseFieldValue(value, 'field', ({ properties: [] } as unknown) as Entity<any>)
    expect(parsed).toBe(value)
  })
  it('Should return parsed ints for Int16', () => {
    const value = '15'
    const parsed = parseFieldValue(value, 'field1', ({
      properties: [{ property: 'field1', type: EdmType.Int16 }],
    } as unknown) as Entity<{ field1: number }>)
    expect(parsed).toBe(parseInt(value, 10))
  })

  it('Should return parsed ints for Int32', () => {
    const value = '18'
    const parsed = parseFieldValue(value, 'field2', ({
      properties: [{ property: 'field2', type: EdmType.Int32 }],
    } as unknown) as Entity<{ field1: number }>)
    expect(parsed).toBe(parseInt(value, 10))
  })

  it('Should return parsed floats for Double', () => {
    const value = '15.2'
    const parsed = parseFieldValue(value, 'field3', ({
      properties: [{ property: 'field3', type: EdmType.Double }],
    } as unknown) as Entity<{ field1: number }>)
    expect(parsed).toBe(parseFloat(value))
  })
})
