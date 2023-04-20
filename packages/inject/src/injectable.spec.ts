import { Injectable } from './injectable'
import { Injector } from './injector'
import { describe, expect, it } from 'vitest'

describe('@Injectable()', () => {
  it('Should fill meta store with default options', () => {
    @Injectable()
    class TestClass1 {}
    const meta = Injector.options.get(TestClass1)
    expect(meta).toBeDefined()
    expect(meta?.lifetime).toBe('transient')
  })

  it('Should fill meta store', () => {
    @Injectable({ lifetime: 'scoped' })
    class TestClass2 {}
    const meta = Injector.options.get(TestClass2)
    expect(meta).toBeDefined()
    expect(meta?.lifetime).toBe('scoped')
  })
})
