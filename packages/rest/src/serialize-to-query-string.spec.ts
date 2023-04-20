import { serializeToQueryString } from './serialize-to-query-string'
import { describe, it, expect } from 'vitest'

describe('serializeToQueryString', () => {
  it('Should serialize primitive values', () => {
    expect(serializeToQueryString({ a: 1, b: false, c: 'foo', d: 0, e: null })).toBe('a=1&b=false&c=foo&d=0&e=null')
  })

  it('Should exclude explicit undefined', () => {
    expect(serializeToQueryString({ a: 1, b: false, c: 'foo', d: undefined })).toBe('a=1&b=false&c=foo')
  })

  it('Should serialize primitive arrays', () => {
    expect(serializeToQueryString({ array: [1, 2, 3, 4] })).toBe('array[]=1&array[]=2&array[]=3&array[]=4')
  })

  it('Should serialize objects', () => {
    expect(serializeToQueryString({ foo: { a: 1, b: 'value' } })).toBe(
      `foo=${encodeURIComponent('{"a":1,"b":"value"}')}`,
    )
  })

  it('Should serialize an array that contains a non-primitive entry', () => {
    const array = [1, 2, 3, { foo: 1 }]
    expect(serializeToQueryString({ array })).toBe(`array=${encodeURIComponent(JSON.stringify(array))}`)
  })
})
