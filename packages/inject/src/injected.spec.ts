import { Injectable } from './injectable.js'
import { Injected, getDependencyList } from './injected.js'
import { describe, expect, it } from 'vitest'
import { Injector } from './injector.js'
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

  it('Should inject a property from the decorator', () => {
    @Injectable()
    class Property {
      foo = 3
    }
    @Injectable()
    class TestClass {
      @Injected(Property)
      declare property: Property
    }

    const instance = new Injector().getInstance(TestClass)
    expect(instance.property).toBeInstanceOf(Property)
    expect(instance.property.foo).toBe(3)
  })

  it('Should throw an error when trying to modify the injected property', () => {
    @Injectable()
    class Property {
      foo = 3
    }
    @Injectable()
    class TestClass {
      @Injected(Property)
      declare property: Property
    }

    const instance = new Injector().getInstance(TestClass)
    expect(() => (instance.property = new Property())).toThrowErrorMatchingInlineSnapshot(
      `[Error: Injected property 'TestClass.property' is read-only]`,
    )
  })

  it('Should inject a property with a callback syntax', () => {
    @Injectable()
    class Property {
      foo = 3
    }
    @Injectable()
    class TestClass {
      private initial = 2

      @Injected(function (this: TestClass, injector) {
        return injector.getInstance(Property).foo + this.initial
      })
      declare property: number
    }

    const instance = new Injector().getInstance(TestClass)
    expect(instance.property).toBe(5)
  })

  it('Should throw an error when trying to modify the injected property with a callback syntax', () => {
    @Injectable()
    class Property {
      foo = 3
    }
    @Injectable()
    class TestClass {
      private initial = 2

      @Injected(function (this: TestClass, injector) {
        return injector.getInstance(Property).foo + this.initial
      })
      declare property: number
    }

    const instance = new Injector().getInstance(TestClass)
    expect(() => (instance.property = 3)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Injected property 'TestClass.property' is read-only]`,
    )
  })
})
