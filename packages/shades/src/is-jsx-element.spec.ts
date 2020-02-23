import { isJsxElement } from './jsx'

describe('isJsxElement', () => {
  it('Should return false if element doesnt have state & props', () => {
    expect(isJsxElement({})).toBeFalsy()
  })
  it('Should return false if element doesnt have props', () => {
    expect(isJsxElement({ state: {} })).toBeFalsy()
  })

  it('Should return false if element doesnt have state', () => {
    expect(isJsxElement({ props: {} })).toBeFalsy()
  })

  it('Should return true if element has state & props', () => {
    expect(isJsxElement({ state: {}, props: {} })).toBeTruthy()
  })
})
