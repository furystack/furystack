import { isKeySubsetOf } from './is-key-subset-of'

describe('isKeySubsetOf', () => {
  it('should return true if the key is a subset of the subset', () => {
    const key = ['a', 'b', 'c']
    const subset = ['a', 'b']
    expect(isKeySubsetOf(key, subset)).toBe(true)
  })

  it('Should return true on complex values', () => {
    const key = [{ a: 1 }, { b: 2 }]
    const subset = [{ a: 1 }]
    expect(isKeySubsetOf(key, subset)).toBe(true)
  })

  it('should return false if the key is not a subset of the subset', () => {
    const key = ['a', 'b', 'c']
    const subset = ['a', 'd']
    expect(isKeySubsetOf(key, subset)).toBe(false)
  })

  it('should return false on order mismatch', () => {
    const key = ['a', 'b', 'c']
    const subset = ['c', 'b']
    expect(isKeySubsetOf(key, subset)).toBe(false)
  })
})
