import { hasState, defaultStateComparer } from './shade'

describe('hasState', () => {
  it('Should return true if the object has an initial state getter', () => {
    const obj = {
      getInitialState() {
        return {}
      },
    }
    expect(hasState(obj)).toBe(true)
  })

  it('Should return false if the object has no initial state getter', () => {
    const obj = {}
    expect(hasState(obj)).toBe(false)
  })

  it('Should return false if the object has an initial state getter that is not a function', () => {
    const obj = {
      getInitialState: {},
    }
    expect(hasState(obj)).toBe(false)
  })
})

describe('defaultStateComparer', () => {
  it('Should return false if the two objects are from the same reference', () => {
    const obj = {
      foo: Math.random(),
      bar: Math.random(),
    }
    expect(defaultStateComparer({ newState: obj, oldState: obj })).toBe(false)
  })

  it('Should return false if the two objects are equal', () => {
    const oldState = {
      foo: Math.random(),
      bar: Math.random(),
    }
    const newState = {
      foo: oldState.foo,
      bar: oldState.bar,
    }
    expect(defaultStateComparer({ newState, oldState })).toBe(false)
  })

  it('Should return false if the two objects are not equal', () => {
    const oldState = {
      foo: Math.random(),
      bar: Math.random(),
    }
    const newState = {
      foo: oldState.foo,
      bar: Math.random() * 2,
    }
    expect(defaultStateComparer({ oldState, newState })).toBe(true)
  })
})
