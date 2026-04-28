import { describe, it, expect } from 'vitest'
import { filterItems } from './filter-items.js'
import type { FilterType } from './models/physical-store.js'

type TestItem = {
  id: number
  name: string
  age: number
  active: boolean
}

const items: TestItem[] = [
  { id: 1, name: 'Alice', age: 30, active: true },
  { id: 2, name: 'Bob', age: 25, active: false },
  { id: 3, name: 'Charlie', age: 35, active: true },
  { id: 4, name: 'Diana', age: 28, active: false },
  { id: 5, name: 'Eve', age: 22, active: true },
]

describe('filterItems', () => {
  describe('no filter', () => {
    it('should return all items when filter is undefined', () => {
      expect(filterItems(items, undefined)).toEqual(items)
    })

    it('should return all items when filter is not provided', () => {
      expect(filterItems(items)).toEqual(items)
    })

    it('should return an empty array when input is empty', () => {
      expect(filterItems<TestItem>([], { name: { $eq: 'Alice' } })).toEqual([])
    })

    it('should return all items when filter is an empty object', () => {
      expect(filterItems(items, {})).toEqual(items)
    })
  })

  describe('$eq', () => {
    it('should return items matching the exact value', () => {
      const result = filterItems(items, { name: { $eq: 'Alice' } })
      expect(result).toEqual([items[0]])
    })

    it('should return empty array when no items match', () => {
      const result = filterItems(items, { name: { $eq: 'Nobody' } })
      expect(result).toEqual([])
    })
  })

  describe('$ne', () => {
    it('should return items not matching the value', () => {
      const result = filterItems(items, { name: { $ne: 'Alice' } })
      expect(result).toEqual([items[1], items[2], items[3], items[4]])
    })
  })

  describe('$in', () => {
    it('should return items whose value is in the array', () => {
      const result = filterItems(items, { name: { $in: ['Alice', 'Bob'] } })
      expect(result).toEqual([items[0], items[1]])
    })

    it('should return empty array when no values match', () => {
      const result = filterItems(items, { name: { $in: ['Nobody'] } })
      expect(result).toEqual([])
    })
  })

  describe('$nin', () => {
    it('should return items whose value is not in the array', () => {
      const result = filterItems(items, { name: { $nin: ['Alice', 'Bob'] } })
      expect(result).toEqual([items[2], items[3], items[4]])
    })
  })

  describe('$gt', () => {
    it('should return items with value greater than the threshold', () => {
      const result = filterItems(items, { age: { $gt: 30 } })
      expect(result).toEqual([items[2]])
    })

    it('should exclude items equal to the threshold', () => {
      const result = filterItems(items, { age: { $gt: 35 } })
      expect(result).toEqual([])
    })
  })

  describe('$gte', () => {
    it('should return items with value greater than or equal to the threshold', () => {
      const result = filterItems(items, { age: { $gte: 30 } })
      expect(result).toEqual([items[0], items[2]])
    })
  })

  describe('$lt', () => {
    it('should return items with value less than the threshold', () => {
      const result = filterItems(items, { age: { $lt: 25 } })
      expect(result).toEqual([items[4]])
    })

    it('should exclude items equal to the threshold', () => {
      const result = filterItems(items, { age: { $lt: 22 } })
      expect(result).toEqual([])
    })
  })

  describe('$lte', () => {
    it('should return items with value less than or equal to the threshold', () => {
      const result = filterItems(items, { age: { $lte: 25 } })
      expect(result).toEqual([items[1], items[4]])
    })
  })

  describe('$startsWith', () => {
    it('should return items whose string field starts with the value', () => {
      const result = filterItems(items, { name: { $startsWith: 'Al' } })
      expect(result).toEqual([items[0]])
    })

    it('should return empty array when no items match', () => {
      const result = filterItems(items, { name: { $startsWith: 'Zz' } })
      expect(result).toEqual([])
    })
  })

  describe('$endsWith', () => {
    it('should return items whose string field ends with the value', () => {
      const result = filterItems(items, { name: { $endsWith: 'ce' } })
      expect(result).toEqual([items[0]])
    })
  })

  describe('$like', () => {
    it('should match with % wildcards', () => {
      const result = filterItems(items, { name: { $like: 'A%' } })
      expect(result).toEqual([items[0]])
    })

    it('should match with % in the middle', () => {
      const result = filterItems(items, { name: { $like: 'A%e' } })
      expect(result).toEqual([items[0]])
    })

    it('should be case-insensitive', () => {
      const result = filterItems(items, { name: { $like: 'alice' } })
      expect(result).toEqual([items[0]])
    })

    it('should escape regex metacharacters in the pattern', () => {
      type Item = { value: string }
      const testItems: Item[] = [{ value: 'foo.bar' }, { value: 'fooXbar' }]
      const result = filterItems(testItems, { value: { $like: 'foo.bar' } })
      expect(result).toEqual([{ value: 'foo.bar' }])
    })
  })

  describe('$regex', () => {
    it('should return items matching the regex', () => {
      const result = filterItems(items, { name: { $regex: '^[A-C]' } })
      expect(result).toEqual([items[0], items[1], items[2]])
    })

    it('should return empty array when no items match', () => {
      const result = filterItems(items, { name: { $regex: '^Z' } })
      expect(result).toEqual([])
    })

    it('should throw on invalid regex syntax', () => {
      expect(() => filterItems(items, { name: { $regex: '[invalid' } })).toThrow()
    })
  })

  describe('$and', () => {
    it('should return items matching all conditions', () => {
      const result = filterItems(items, { $and: [{ age: { $gte: 25 } }, { active: { $eq: true } }] })
      expect(result).toEqual([items[0], items[2]])
    })

    it('should return empty array when conditions are mutually exclusive', () => {
      const result = filterItems(items, { $and: [{ name: { $eq: 'Alice' } }, { name: { $eq: 'Bob' } }] })
      expect(result).toEqual([])
    })
  })

  describe('$or', () => {
    it('should return items matching any condition', () => {
      const result = filterItems(items, { $or: [{ name: { $eq: 'Alice' } }, { name: { $eq: 'Bob' } }] })
      expect(result).toEqual([items[0], items[1]])
    })

    it('should return empty array when no conditions match', () => {
      const result = filterItems(items, { $or: [{ name: { $eq: 'Nobody' } }, { name: { $eq: 'Nope' } }] })
      expect(result).toEqual([])
    })
  })

  describe('combined field-level filters', () => {
    it('should AND multiple field filters together', () => {
      const result = filterItems(items, { age: { $gte: 25 }, active: { $eq: true } })
      expect(result).toEqual([items[0], items[2]])
    })
  })

  describe('error cases', () => {
    it('should throw when a field filter is not an object', () => {
      const badFilter = { name: 'Alice' } as unknown as FilterType<TestItem>
      expect(() => filterItems(items, badFilter)).toThrow("The filter has to be an object, got string for field 'name'")
    })

    it('should throw for an unsupported filter operation', () => {
      const badFilter = { name: { $unknown: 'x' } } as unknown as FilterType<TestItem>
      expect(() => filterItems(items, badFilter)).toThrow("The filter key '$unknown' is not a valid operation")
    })
  })
})
