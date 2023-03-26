import { areKeysEqual } from './are-keys-equal'

describe('areKeysEqual', () => {
  it('Should return true for primitive equality', () => {
    expect(areKeysEqual(1, 1)).toBe(true)
    expect(areKeysEqual('foo', 'foo')).toBe(true)
    expect(areKeysEqual(true, true)).toBe(true)
    expect(areKeysEqual(null, null)).toBe(true)
    expect(areKeysEqual(undefined, undefined)).toBe(true)
  })

  it('Should return false for primitive inequality', () => {
    expect(areKeysEqual(1, 2)).toBe(false)
    expect(areKeysEqual('foo', 'bar')).toBe(false)
    expect(areKeysEqual(true, false)).toBe(false)
    expect(areKeysEqual(null, undefined)).toBe(false)
    expect(areKeysEqual(undefined, null)).toBe(false)
  })

  it('Should return true for object equality', () => {
    expect(areKeysEqual({}, {})).toBe(true)
    expect(areKeysEqual({ foo: 'bar' }, { foo: 'bar' })).toBe(true)
    expect(areKeysEqual({ foo: 'bar', bar: 'foo' }, { foo: 'bar', bar: 'foo' })).toBe(true)
    expect(areKeysEqual({ foo: 'bar', bar: 'foo' }, { bar: 'foo', foo: 'bar' })).toBe(true)
  })

  it('Should return false for object inequality', () => {
    expect(areKeysEqual({}, { foo: 'bar' })).toBe(false)
    expect(areKeysEqual({ foo: 'bar' }, { foo: 'baz' })).toBe(false)
    expect(areKeysEqual({ foo: 'bar' }, { bar: 'foo' })).toBe(false)
  })

  it('Should return true for array equality', () => {
    expect(areKeysEqual([], [])).toBe(true)
    expect(areKeysEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(areKeysEqual(['foo', 'bar'], ['foo', 'bar'])).toBe(true)
    expect(areKeysEqual([1, 'foo', true], [1, 'foo', true])).toBe(true)
  })

  it('Should return false for array inequality', () => {
    expect(areKeysEqual([], [1, 2, 3])).toBe(false)
    expect(areKeysEqual([1, 2, 3], [1, 2, 3, 4])).toBe(false)
    expect(areKeysEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(areKeysEqual([1, 2, 3], [1, 2, '3'])).toBe(false)
  })

  it('Should return false for type mismatch', () => {
    expect(areKeysEqual<any>(1, '1')).toBe(false)
    expect(areKeysEqual<any>('1', 1)).toBe(false)
    expect(areKeysEqual<any>(1, {})).toBe(false)
    expect(areKeysEqual<any>({}, 1)).toBe(false)
    expect(areKeysEqual<any>(1, [])).toBe(false)
    expect(areKeysEqual<any>([], 1)).toBe(false)
    expect(areKeysEqual<any>({}, [])).toBe(false)
    expect(areKeysEqual<any>([], {})).toBe(false)
  })
})
