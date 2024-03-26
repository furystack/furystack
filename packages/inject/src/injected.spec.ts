import { Injected, getDependencyList } from './injected.js'
import { describe, expect, it } from 'vitest'
describe('@Injected()', () => {
  it('Should register into the injectable fields', () => {
    class Property {
      foo = 3
    }
    class TestClass {
      @Injected(Property)
      public property!: Property

      property2?: Property

      @Injected(Property)
      property3!: Property
    }

    const dependencyList = getDependencyList(TestClass)
    expect(dependencyList.has(Property)).toBeTruthy()
  })
})
