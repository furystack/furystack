import { deserializeQueryString } from './deserialize-query-string.js'
import { serializeToQueryString, serializeValue } from './serialize-to-query-string.js'
import { describe, it, expect } from 'vitest'

describe('deserializeQueryString', () => {
  it('Should deserialize a null value', () => {
    expect(deserializeQueryString(null as any)).toEqual({})
  })

  it('Should deserialize an undefined value', () => {
    expect(deserializeQueryString(undefined as any)).toEqual({})
  })

  it('Should deserialize an empty string value', () => {
    expect(deserializeQueryString('')).toEqual({})
  })

  it('Should deserialize a string value with no keys / values', () => {
    expect(deserializeQueryString('?')).toEqual({})
  })

  it('Should deserialize a string with given value but empty key', () => {
    expect(deserializeQueryString('?=alma')).toEqual({})
  })

  it('Should deserialize a string with given key but empty value', () => {
    expect(deserializeQueryString('?alma=')).toEqual({})
  })

  it('Should deserialize a list of primitive values', () => {
    expect(
      deserializeQueryString(`?foo=${serializeValue('value')}&bar=${serializeValue(2)}&baz=${serializeValue(false)}`),
    ).toEqual({
      foo: 'value',
      bar: 2,
      baz: false,
    })
  })

  it('Should override a value if not specified as an array', () => {
    expect(
      deserializeQueryString(
        `?foo=${serializeValue('value')}&foo=${serializeValue(2)}&foo=${serializeValue(false)}&foo=${serializeValue(
          'bar',
        )}`,
      ),
    ).toEqual({ foo: 'bar' })
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
    expect(deserializeQueryString(`?alma=${serializeValue('asd/*-@?')}`)).toEqual({ alma: 'asd/*-@?' })
  })
})
