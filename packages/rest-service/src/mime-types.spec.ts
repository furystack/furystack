import { getMimeForFile } from './mime-types'
describe('MIME Types', () => {
  it('Should return a default fallback', () => {
    expect(getMimeForFile('test.alma')).toBe('application/octet-stream')
  })

  it('Should return a value from a supported list', () => {
    expect(getMimeForFile('asd/123/test.mp4')).toBe('video/mp4')
  })

  it('Should return a value from a wildcarded entry list', () => {
    expect(getMimeForFile('asd/123/test.asdxml')).toBe('text/xml')
  })
})
