import { Disposable, usingAsync } from '@sensenet/client-utils'
import { Injectable } from '../src/Injectable'
import { Injector } from '../src/Injector'

// tslint:disable:max-classes-per-file

describe('Injector', () => {
  it('Shold be constructed', () => {
    const i = new Injector()
    expect(i).toBeInstanceOf(Injector)
  })

  it('Parent should be the default instance, if not specified', () => {
    const i = new Injector()
    expect(i.options.parent).toBeUndefined()
  })

  it('Should throw an error on circular dependencies', () => {
    const i = new Injector()
    @Injectable()
    class InstanceClass {
      constructor(public ohgodno: InstanceClass) {
        /** */
      }
    }
    expect(() => i.getInstance(InstanceClass)).toThrow()
  })

  it('Should set and return instance from cache', () => {
    const i = new Injector()
    @Injectable()
    class InstanceClass {
      constructor() {
        /** */
      }
    }
    const instance = new InstanceClass()
    i.setExplicitInstance(instance)
    expect(i.getInstance(InstanceClass)).toBe(instance)
  })

  it('Should return from a parent injector if available', () => {
    const parent = new Injector()
    const i = parent.createChild()
    @Injectable()
    class InstanceClass {
      constructor() {
        /** */
      }
    }
    const instance = new InstanceClass()
    parent.setExplicitInstance(instance)
    expect(i.getInstance(InstanceClass)).toBe(instance)
    // tslint:disable-next-line:no-string-literal
    expect(parent['cachedSingletons'].get(InstanceClass)).toBe(instance)
  })

  it('Should create instance on a parent injector if not available', () => {
    const parent = new Injector()
    const i = parent.createChild()
    @Injectable()
    class InstanceClass {
      constructor() {
        /** */
      }
    }
    expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
    expect(
      // tslint:disable-next-line:no-string-literal
      parent['cachedSingletons'].get(InstanceClass),
    ).toBeInstanceOf(InstanceClass)
  })

  it('Should resolve parameters', () => {
    const i = new Injector()

    @Injectable()
    class Injected1 {}
    @Injectable()
    class Injected2 {}

    @Injectable()
    class InstanceClass {
      constructor(public injected1: Injected1, public injected2: Injected2) {
        /** */
      }
    }
    expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
    expect(i.getInstance(InstanceClass).injected1).toBeInstanceOf(Injected1)
    expect(i.getInstance(InstanceClass).injected2).toBeInstanceOf(Injected2)
  })

  it('Should resolve parameters recursively', () => {
    const i = new Injector()

    @Injectable()
    class Injected1 {}
    @Injectable()
    class Injected2 {
      constructor(public injected1: Injected1) {}
    }

    @Injectable()
    class InstanceClass {
      constructor(public injected2: Injected2) {
        /** */
      }
    }
    expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
    expect(i.getInstance(InstanceClass).injected2.injected1).toBeInstanceOf(Injected1)
  })

  it('Should be disposed', async () => {
    await usingAsync(new Injector(), async () => {
      /** */
    })
  })

  it('Should dispose cached entries on dispose and tolerate non-disposable ones', done => {
    class TestDisposable implements Disposable {
      public dispose() {
        done()
      }
    }
    class TestInstance {}

    usingAsync(new Injector(), async i => {
      i.setExplicitInstance(new TestDisposable())
      i.setExplicitInstance(new TestInstance())
    })
  })
})
