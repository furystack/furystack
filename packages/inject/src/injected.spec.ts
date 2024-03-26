import { Injectable } from './injectable.js'
import { Injected, getDependencyList } from './injected.js'
import { describe, expect, it } from 'vitest'
describe('@Injected()', () => {
  it('Should register into the injectable fields', () => {
    @Injectable()
    class Property {
      foo = 3
    }
    class TestClass {
      @Injected(Property)
      declare property: Property

      declare property2?: Property

      @Injected(Property)
      declare property3: Property
    }

    const dependencyList = getDependencyList(TestClass)
    expect(dependencyList.has(Property)).toBeTruthy()
  })
})
