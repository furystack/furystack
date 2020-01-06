import { JsonResult, PlainTextResult, XmlResult, EmptyResult, BypassResult } from '../src'

describe('RequestActions', () => {
  it('Defaults should match the snapshots', () => {
    expect(JsonResult({ foo: 1 })).toMatchSnapshot()
    expect(PlainTextResult('alma')).toMatchSnapshot()
    expect(XmlResult('alma')).toMatchSnapshot()
    expect(EmptyResult()).toMatchSnapshot()
    expect(BypassResult()).toMatchSnapshot()
  })
})
