import { parseOrderBy } from './order-by'

describe('OrderBy', () => {
  it('Should parse a single value', () => {
    const orderBy = parseOrderBy('fieldName ASC')
    expect(orderBy).toEqual({ fieldName: 'ASC' })
  })

  it('Should parse multiple values', () => {
    const orderBy = parseOrderBy('field1 ASC, field2 desc, field3')
    expect(orderBy).toEqual({ field1: 'ASC', field2: 'DESC', field3: 'ASC' })
  })
})
