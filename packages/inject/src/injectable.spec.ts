import { Injectable, InjectableOptionsSymbol, getInjectableOptions, hasInjectableOptions } from './injectable.js'
import { describe, expect, it } from 'vitest'

describe('hasInjectableOptions', () => {
  it('Should return true if the object has the InjectableOptionsSymbol', () => {
    class Alma {}
    Object.assign(Alma, { [InjectableOptionsSymbol]: { lifetime: 'singleton' } })
    expect(hasInjectableOptions(Alma)).toBe(true)
  })

  it('Should return false if the object does not have the InjectableOptionsSymbol', () => {
    class Alma {}
    expect(hasInjectableOptions(Alma)).toBe(false)
  })

  it('Should return false if the object is not an object', () => {
    expect(hasInjectableOptions('' as any)).toBe(false)
  })
})

describe('getInjectableOptions', () => {
  it('Should throw an error if the object does not have the InjectableOptionsSymbol', () => {
    class Alma {}
    expect(() => getInjectableOptions(Alma)).toThrowError("The class 'Alma' is not an injectable")
  })

  it('Should return the options if the object has the InjectableOptionsSymbol', () => {
    class Alma {}
    Object.assign(Alma, { [InjectableOptionsSymbol]: { lifetime: 'singleton' } })
    expect(getInjectableOptions(Alma)).toEqual({ lifetime: 'singleton' })
  })
})

describe('@Injectable()', () => {
  it('Should attach the default options by default', () => {
    @Injectable()
    class TestClass1 {}

    const meta = getInjectableOptions(TestClass1)

    expect(meta).toBeDefined()
    expect(meta?.lifetime).toBe('transient')
  })

  it('Should attach the explicitly set options', () => {
    @Injectable({ lifetime: 'scoped' })
    class TestClass2 {}
    const meta = getInjectableOptions(TestClass2)
    expect(meta).toBeDefined()
    expect(meta?.lifetime).toBe('scoped')
  })
})
