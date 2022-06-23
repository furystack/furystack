import { Injected } from './injected'
import { Injector } from './injector'
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

    expect(Injector.injectableFields.has(TestClass)).toBe(true)
    expect(Injector.injectableFields.get(TestClass)).toEqual({
      property: Property,
      property3: Property,
    })
  })
})