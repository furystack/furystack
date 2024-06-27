import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { Injectable } from './injectable.js'
import { Injected } from './injected.js'
import { Injector } from './injector.js'

describe('Injector', () => {
  it('Shold be constructed', () => {
    const i = new Injector()
    expect(i).toBeInstanceOf(Injector)
  })

  it('Parent should be undefined by default', () => {
    const i = new Injector()
    expect(i.options.parent).toBeUndefined()
  })

  it('Should set and return instance from cache', () => {
    const i = new Injector()
    @Injectable({ lifetime: 'scoped' })
    class InstanceClass {}
    const instance = new InstanceClass()
    i.setExplicitInstance(instance)
    expect(i.getInstance(InstanceClass)).toBe(instance)
  })

  it('Should throw an error when setting an Injector instance', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(() => i.setExplicitInstance(new Injector())).toThrowError('Cannot set an injector instance as injectable')
    })
  })

  it('Should return from a parent injector if available', () => {
    const parent = new Injector()
    const i = parent.createChild()
    @Injectable({ lifetime: 'singleton' })
    class InstanceClass {}
    const instance = new InstanceClass()
    parent.setExplicitInstance(instance)
    expect(i.getInstance(InstanceClass)).toBe(instance)
    expect(parent.cachedSingletons.get(InstanceClass)).toBe(instance)
  })

  it('Should create instance on a parent injector if not available', () => {
    const parent = new Injector()
    const i = parent.createChild()
    @Injectable({ lifetime: 'singleton' })
    class InstanceClass {}
    expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
    expect(parent.cachedSingletons.get(InstanceClass)).toBeInstanceOf(InstanceClass)
  })

  it('Should resolve parameters', () => {
    const i = new Injector()

    @Injectable()
    class Injected1 {}
    @Injectable()
    class Injected2 {}

    @Injectable()
    class InstanceClass {
      @Injected(Injected1)
      declare injected1: Injected1

      @Injected(Injected2)
      declare injected2: Injected2
    }

    const instance = i.getInstance(InstanceClass)

    expect(instance).toBeInstanceOf(InstanceClass)
    expect(instance.injected1).toBeInstanceOf(Injected1)
    expect(instance.injected2).toBeInstanceOf(Injected2)
  })

  it('Should resolve parameters recursively', () => {
    const i = new Injector()

    @Injectable()
    class Injected1 {}
    @Injectable()
    class Injected2 {
      @Injected(Injected1)
      declare injected1: Injected1
    }

    @Injectable()
    class InstanceClass {
      @Injected(Injected2)
      declare injected2: Injected2
    }
    expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
    expect(i.getInstance(InstanceClass).injected2.injected1).toBeInstanceOf(Injected1)
  })

  it('Should be disposed', async () => {
    await usingAsync(new Injector(), async () => {
      /** */
    })
  })

  it('Should throw if failed to dispose one or more entries', async () => {
    expect.assertions(1)

    @Injectable({ lifetime: 'singleton' })
    class TestDisposableThrows implements Disposable {
      public [Symbol.dispose]() {
        throw Error(':(')
      }
    }

    const i = new Injector()
    i.getInstance(TestDisposableThrows)

    try {
      await i[Symbol.asyncDispose]()
    } catch (error) {
      expect((error as Error).message).toBe(
        "There was an error during disposing '1' global disposable objects: Error: :(",
      )
    }
  })

  it('Should dispose cached entries on dispose and tolerate non-disposable ones', async () => {
    const doneCallback = vi.fn()
    class TestDisposable implements Disposable {
      public [Symbol.dispose]() {
        doneCallback()
      }
    }
    class TestInstance {}

    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance(new TestDisposable())
      i.setExplicitInstance(new TestInstance())
    })
    expect(doneCallback).toBeCalledTimes(1)
  })

  it('Remove should remove an entity from the cached singletons list', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance({}, Object)
      i.remove(Object)
      expect(i.cachedSingletons.size).toBe(0)
    })
  })

  it('Requesting an Injector instance should return self', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(i.getInstance(Injector)).toBe(i)
    })
  })

  it('Requesting an undecorated instance should throw an error', async () => {
    class UndecoratedTestClass {}
    await usingAsync(new Injector(), async (i) => {
      expect(() => i.getInstance(UndecoratedTestClass)).toThrowError(
        `The class 'UndecoratedTestClass' is not an injectable`,
      )
    })
  })

  it('Singleton with transient dependencies should throw an error', async () => {
    @Injectable({ lifetime: 'transient' })
    class Trs1 {}

    @Injectable({ lifetime: 'singleton' })
    class St1 {
      @Injected(Trs1)
      declare lt: Trs1
    }

    await usingAsync(new Injector(), async (i) => {
      expect(() => i.getInstance(St1)).toThrowError(
        `Injector error: Singleton type 'St1' depends on non-singleton injectables: Trs1:transient`,
      )
    })
  })

  it('Singleton with transient dependencies should throw an error', async () => {
    @Injectable({ lifetime: 'scoped' })
    class Sc1 {}

    @Injectable({ lifetime: 'singleton' })
    class St2 {
      @Injected(Sc1)
      declare sc: Sc1
    }

    await usingAsync(new Injector(), async (i) => {
      expect(() => i.getInstance(St2)).toThrowError(
        `Injector error: Singleton type 'St2' depends on non-singleton injectables: Sc1:scoped`,
      )
    })
  })

  it('Scoped with transient dependencies should throw an error', async () => {
    @Injectable({ lifetime: 'transient' })
    class Tr2 {}

    @Injectable({ lifetime: 'scoped' })
    class Sc2 {
      @Injected(Tr2)
      declare sc: Tr2
    }

    await usingAsync(new Injector(), async (i) => {
      expect(() => i.getInstance(Sc2)).toThrowError(
        `Injector error: Scoped type 'Sc2' depends on transient injectables: Tr2:transient`,
      )
    })
  })

  it('Should exec an init() method, if present', async () => {
    @Injectable()
    class InitClass {
      public initWasCalled = false
      public init() {
        this.initWasCalled = true
      }
    }

    await usingAsync(new Injector(), async (i) => {
      const instance = i.getInstance(InitClass)
      expect(instance.initWasCalled).toBe(true)
    })
  })

  describe('Disposed injector', () => {
    it('Should throw an error on getInstance', async () => {
      const i = new Injector()
      await i[Symbol.asyncDispose]()
      expect(() => i.getInstance(Injector)).toThrowError('Injector already disposed')
    })

    it('Should throw an error on setExplicitInstance', async () => {
      const i = new Injector()
      await i[Symbol.asyncDispose]()
      expect(() => i.setExplicitInstance({})).toThrowError('Injector already disposed')
    })

    it('Should throw an error on remove', async () => {
      const i = new Injector()
      await i[Symbol.asyncDispose]()
      expect(() => i.remove(Object)).toThrowError('Injector already disposed')
    })

    it('Should throw an error on createChild', async () => {
      const i = new Injector()
      await i[Symbol.asyncDispose]()
      expect(() => i.createChild()).toThrowError('Injector already disposed')
    })

    it('Should throw an error on dispose', async () => {
      const i = new Injector()
      await i[Symbol.asyncDispose]()
      await expect(async () => await i[Symbol.asyncDispose]()).rejects.toThrowError('Injector already disposed')
    })
  })
})
