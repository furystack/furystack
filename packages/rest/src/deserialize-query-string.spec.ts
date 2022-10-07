import { deserializeQueryString } from './deserialize-query-string.js'
import { serializeToQueryString } from './serialize-to-query-string.js'
import { describe, expect, it } from 'vitest'

describe('deserializeQueryString', () => {
  it('Should serialize a list of primitive values', () => {
    expect(deserializeQueryString('?foo=value&bar=2&baz=false')).toStrictEqual({ foo: 'value', bar: 2, baz: false })
  })

  it('Should serialize an array', () => {
    expect(deserializeQueryString('?foo[]=value&foo[]=2&foo[]=false')).toStrictEqual({ foo: ['value', 2, false] })
  })

  it('Should serialize and deserialize an object with primitives', () => {
    const value = { foo: 1, bar: 'foo', baz: false, asd: null }
    expect(deserializeQueryString(serializeToQueryString(value))).toStrictEqual(value)
  })

  it('Should serialize and deserialize an array with primitives', () => {
    const value = { foo: [1, 'foo', false, null] }
    expect(deserializeQueryString(serializeToQueryString(value))).toStrictEqual(value)
  })

  it('Should serialize and deserialize two arrays with primitives', () => {
    const value = { foo: [1, 'foo', false, null], bar: [3, 'bar', true, -3.5] }
    expect(deserializeQueryString(serializeToQueryString(value))).toStrictEqual(value)
  })
})
