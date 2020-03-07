import { JsonResult, PlainTextResult, XmlResult, EmptyResult, BypassResult } from './models/request-action'

describe('RequestActions', () => {
  it('should return the default JsonResult', () => {
    expect(JsonResult({ foo: 1 })).toEqual({
      chunk: '{"foo":1}',
      headers: {
        'Content-Type': 'application/json',
      },
      statusCode: 200,
    })
  })

  it('should return the default PlainTextResult', () => {
    expect(PlainTextResult('alma')).toEqual({
      chunk: 'alma',
      headers: {
        'Content-Type': 'plain/text',
      },
      statusCode: 200,
    })
  })

  it('should return the default XmlResult', () => {
    expect(XmlResult('alma')).toEqual({
      chunk: 'alma',
      headers: {
        'Content-Type': 'application/xml;charset=utf-8',
      },
      statusCode: 200,
    })
  })

  it('should return the default EmptyResult', () => {
    expect(EmptyResult()).toEqual({ headers: {}, statusCode: 200 })
  })

  it('should return the default BypassResult', () => {
    expect(BypassResult()).toEqual({
      chunk: 'BypassResult',
    })
  })
})
