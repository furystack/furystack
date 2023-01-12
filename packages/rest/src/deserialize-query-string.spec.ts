import { deserializeQueryString } from './deserialize-query-string'
import { serializeToQueryString } from './serialize-to-query-string'

describe('deserializeQueryString', () => {
  it('Should serialize a null value', () => {
    expect(deserializeQueryString(null as any)).toEqual({})
  })

  it('Should serialize an undefined value', () => {
    expect(deserializeQueryString(undefined as any)).toEqual({})
  })

  it('Should serialize an empty string value', () => {
    expect(deserializeQueryString('')).toEqual({})
  })

  it('Should serialize a string with given value but empty key', () => {
    expect(deserializeQueryString('?=alma')).toEqual({})
  })

  it('Should serialize a string with given key but empty value', () => {
    expect(deserializeQueryString('?alma=')).toEqual({})
  })

  it('Should serialize a list of primitive values', () => {
    expect(deserializeQueryString('?foo=value&bar=2&baz=false')).toEqual({ foo: 'value', bar: 2, baz: false })
  })

  it('Should serialize an array', () => {
    expect(deserializeQueryString('?foo[]=value&foo[]=2&foo[]=false')).toEqual({ foo: ['value', 2, false] })
  })

  it('Should serialize and deserialize an object with primitives', () => {
    const value = { foo: 1, bar: 'foo', baz: false, asd: null }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })

  it('Should serialize and deserialize an array with primitives', () => {
    const value = { foo: [1, 'foo', false, null] }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })

  it('Should serialize and deserialize two arrays with primitives', () => {
    const value = { foo: [1, 'foo', false, null], bar: [3, 'bar', true, -3.5] }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })
})
