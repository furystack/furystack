import { serializeToQueryString } from './serialize-to-query-string.js'
import { describe, it, expect } from 'vitest'

describe('serializeToQueryString', () => {
  it('Should serialize primitive values', () => {
    expect(serializeToQueryString({ a: 1, b: false, c: 'foo', d: 0, e: null })).toMatchInlineSnapshot(
      '"a=MQ%253D%253D&b=ZmFsc2U%253D&c=ImZvbyI%253D&d=MA%253D%253D&e=bnVsbA%253D%253D"',
    )
  })

  it('Should exclude explicit undefined', () => {
    expect(serializeToQueryString({ a: 1, b: false, c: 'foo', d: undefined })).toMatchInlineSnapshot(
      '"a=MQ%253D%253D&b=ZmFsc2U%253D&c=ImZvbyI%253D"',
    )
  })

  it('Should serialize primitive arrays', () => {
    expect(serializeToQueryString({ array: [1, 2, 3, 4] })).toMatchInlineSnapshot('"array=WzEsMiwzLDRd"')
  })

  it('Should serialize objects', () => {
    expect(serializeToQueryString({ foo: { a: 1, b: 'value' } })).toMatchInlineSnapshot(
      '"foo=eyJhIjoxLCJiIjoidmFsdWUifQ%253D%253D"',
    )
  })

  it('Should serialize an array that contains a non-primitive entry', () => {
    const array = [1, 2, 3, { foo: 1 }]
    expect(serializeToQueryString({ array })).toMatchInlineSnapshot('"array=WzEsMiwzLHsiZm9vIjoxfV0%253D"')
  })
})
