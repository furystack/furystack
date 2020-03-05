import { parseFilter } from './filter'
import { EdmType, Entity } from '../models'

describe('Filter', () => {
  class Alma {
    public id!: number
    public stringField!: string
    public numberField!: number
    public floatField!: number
  }

  const testEntity: Entity<Alma> = {
    model: Alma,
    primaryKey: 'id',
    properties: [
      {
        property: 'stringField',
        type: EdmType.String,
      },
      {
        property: 'floatField',
        type: EdmType.Double,
      },
      {
        property: 'numberField',
        type: EdmType.Int32,
      },
    ],
  }

  it('Should throw on unsupported expressions', () => {
    expect(() => parseFilter('field notSupported 1', testEntity)).toThrowError(
      "Failed to parse the following expression: 'field notSupported 1'",
    )
  })

  it('Should parse single $eq witn string expressions', () => {
    expect(parseFilter("stringField eq 'alma'", testEntity)).toEqual({
      stringField: { $eq: 'alma' },
    })
  })

  it('Should parse single $eq witn string and special characters', () => {
    expect(parseFilter("stringField eq 'alma%&@'", testEntity)).toEqual({
      stringField: { $eq: 'alma%&@' },
    })
  })

  it('Should parse single $eq witn int expressions', () => {
    expect(parseFilter('numberField eq 15', testEntity)).toEqual({
      numberField: { $eq: 15 },
    })
  })
  it('Should parse single $eq witn int expressions', () => {
    expect(parseFilter('floatField eq 3.2', testEntity)).toEqual({
      floatField: { $eq: 3.2 },
    })
  })

  it('Should parse $ne expressions', () => {
    expect(parseFilter("stringField ne 'alma'", testEntity)).toEqual({
      stringField: { $ne: 'alma' },
    })
  })

  it('Should parse $gt expressions', () => {
    expect(parseFilter('numberField gt 13', testEntity)).toEqual({
      numberField: { $gt: 13 },
    })
  })

  it('Should parse $gte expressions', () => {
    expect(parseFilter('floatField gte 13.5', testEntity)).toEqual({
      floatField: { $gte: 13.5 },
    })
  })

  it('Should parse $lt expressions', () => {
    expect(parseFilter('numberField lt 14', testEntity)).toEqual({
      numberField: { $lt: 14 },
    })
  })

  it('Should parse $gte expressions', () => {
    expect(parseFilter('floatField lte 15.5', testEntity)).toEqual({
      floatField: { $lte: 15.5 },
    })
  })
})
