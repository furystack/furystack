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

  it('Should serialize a string value with no keys / values', () => {
    expect(deserializeQueryString('?')).toEqual({})
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

  it('Should override a value if not specified as an array', () => {
    expect(deserializeQueryString('?foo=value&foo=2&foo=false&foo=bar')).toEqual({ foo: 'bar' })
  })

  it('Should serialize and deserialize an object with primitives', () => {
    const value = { foo: 1, bar: 'foo', baz: false, asd: null }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })

  it('Should serialize and deserialize an array with primitives', () => {
    const value = { foo: [1, 'foo', false, null] }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })

  it('Should serialize and deserialize a complex structure', () => {
    const value = { foo: [1, 'foo', false, null], bar: [3, 'bar', true, -3.5], baz: 'no' }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })

  it('Should serialize and deserialize an encoded string value', () => {
    const value = { foo: [1, 'foo@alma.hu', false, null], bar: [3, 'bar/*-+', true, -3.5], baz: 'no' }
    expect(deserializeQueryString(serializeToQueryString(value))).toEqual(value)
  })

  it('Should deserialize escaped values', () => {
    expect(deserializeQueryString('?alma=asd%2F*-%40')).toEqual({ alma: 'asd/*-@' })
  })
})
