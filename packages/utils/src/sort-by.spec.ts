import './sort-by'
import { describe, expect, it } from 'vitest'
describe('sortBy', () => {
  it('Should sort by ascending by default', () => {
    const arr = [{ v: 5 }, { v: 3 }, { v: 4 }]
    expect(arr.sortBy('v')).toEqual([{ v: 3 }, { v: 4 }, { v: 5 }])
  })

  it('Should sort by ascending', () => {
    const arr = [{ v: 5 }, { v: 4 }, { v: 3 }]
    expect(arr.sortBy('v', 'asc')).toEqual([{ v: 3 }, { v: 4 }, { v: 5 }])
  })

  it('Should sort by descending', () => {
    const arr = [{ v: 3 }, { v: 4 }, { v: 5 }]
    expect(arr.sortBy('v', 'desc')).toEqual([{ v: 5 }, { v: 4 }, { v: 3 }])
  })

  it('Should handle equalities', () => {
    const arr = [{ v: 3 }, { v: 4 }, { v: 4 }]
    expect(arr.sortBy('v', 'desc')).toEqual([{ v: 4 }, { v: 4 }, { v: 3 }])
  })
})
