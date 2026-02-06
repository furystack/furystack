import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { Injectable } from './injectable.js'
import { Injected } from './injected.js'
import { Injector } from './injector.js'
import { getInjectorReference } from './with-injector-reference.js'

describe('Injector', () => {
  it('Shold be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(i).toBeInstanceOf(Injector)
    })
  })

  it('Should be disposed', async () => {
    await usingAsync(new Injector(), async () => {
      /** */
    })
  })

  it('Parent should be undefined by default', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(i.options.parent).toBeUndefined()
    })
  })

  it('Should throw an error when setting an Injector instance', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(() => i.setExplicitInstance(new Injector())).toThrowError('Cannot set an injector instance as injectable')
    })
  })

  it('Should throw an error when trying to set an instance without decorator', async () => {
    await usingAsync(new Injector(), async (i) => {
      class TestClass {}
      expect(() => i.setExplicitInstance(new TestClass())).toThrowError(`The class 'TestClass' is not an injectable`)
    })
  })

  describe('Transient lifetime', () => {
    it('Should not store an instance in the cache', async () => {
      await usingAsync(new Injector(), async (i) => {
        @Injectable({ lifetime: 'transient' })
        class InstanceClass {}

        const instance = i.getInstance(InstanceClass)
        expect(instance).toBeInstanceOf(InstanceClass)
        expect(i.cachedSingletons.get(InstanceClass)).toBeUndefined()
      })
    })

    it('Should throw an error if you try to set an explicit instance', async () => {
      await usingAsync(new Injector(), async (i) => {
        @Injectable({ lifetime: 'transient' })
        class InstanceClass {}

        const instance = new InstanceClass()
        expect(() => i.setExplicitInstance(instance)).toThrowError(
          `Cannot set an instance of 'InstanceClass' as it's lifetime is set to 'transient'`,
        )
      })
    })
  })

  describe('Scoped lifetime', () => {
    it('Should set and return instance from cache', async () => {
      await usingAsync(new Injector(), async (i) => {
        @Injectable({ lifetime: 'scoped' })
        class InstanceClass {}
        const instance = new InstanceClass()
        i.setExplicitInstance(instance)
        expect(i.getInstance(InstanceClass)).toBe(instance)
      })
    })

    it('Should instantiate and return an instance', async () => {
      await usingAsync(new Injector(), async (i) => {
        @Injectable({ lifetime: 'scoped' })
        class InstanceClass {}
        expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
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
  })

  describe('Singleton lifetime', () => {
    it('Should return from a parent injector if available', async () => {
      await usingAsync(new Injector(), async (parent) => {
        const i = parent.createChild()
        @Injectable({ lifetime: 'singleton' })
        class InstanceClass {}
        const instance = new InstanceClass()
        parent.setExplicitInstance(instance)
        expect(i.getInstance(InstanceClass)).toBe(instance)
        expect(parent.cachedSingletons.get(InstanceClass)).toBe(instance)
      })
    })

    it('Should create instance on a parent injector if not available', async () => {
      await usingAsync(new Injector(), async (parent) => {
        const i = parent.createChild()
        @Injectable({ lifetime: 'singleton' })
        class InstanceClass {}
        expect(i.getInstance(InstanceClass)).toBeInstanceOf(InstanceClass)
        expect(parent.cachedSingletons.get(InstanceClass)).toBeInstanceOf(InstanceClass)
      })
    })

    it('Should preserve parent injector reference when singleton is retrieved from child', async () => {
      await usingAsync(new Injector(), async (parent) => {
        const child = parent.createChild()

        @Injectable({ lifetime: 'singleton' })
        class SingletonClass {}

        // Parent creates the singleton first
        const instanceFromParent = parent.getInstance(SingletonClass)
        expect(getInjectorReference(instanceFromParent)).toBe(parent)

        // Child retrieves the same singleton - injector reference should still point to parent
        const instanceFromChild = child.getInstance(SingletonClass)
        expect(instanceFromChild).toBe(instanceFromParent)
        expect(getInjectorReference(instanceFromChild)).toBe(parent)
      })
    })

    it('Should set parent injector reference when singleton is first created via child', async () => {
      await usingAsync(new Injector(), async (parent) => {
        const child = parent.createChild()

        @Injectable({ lifetime: 'singleton' })
        class SingletonClass {}

        // Child requests singleton first - it should be created on parent with parent's reference
        const instanceFromChild = child.getInstance(SingletonClass)
        expect(parent.cachedSingletons.get(SingletonClass)).toBe(instanceFromChild)
        expect(getInjectorReference(instanceFromChild)).toBe(parent)

        // Parent retrieves same singleton - reference should still be parent
        const instanceFromParent = parent.getInstance(SingletonClass)
        expect(instanceFromParent).toBe(instanceFromChild)
        expect(getInjectorReference(instanceFromParent)).toBe(parent)
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
  })

  describe('Explicit lifetime', () => {
    it('Should return the instance from the cache', async () => {
      await usingAsync(new Injector(), async (i) => {
        @Injectable({ lifetime: 'explicit' })
        class InstanceClass {}

        const instance = new InstanceClass()
        i.setExplicitInstance(instance)
        expect(i.getInstance(InstanceClass)).toBe(instance)
      })
    })

    it('Should return an instance from the parent injector', async () => {
      await usingAsync(new Injector(), async (i) => {
        const child = i.createChild()
        @Injectable({ lifetime: 'explicit' })
        class InstanceClass {}

        const instance = new InstanceClass()
        i.setExplicitInstance(instance)
        expect(child.getInstance(InstanceClass)).toBe(instance)
      })
    })

    it('Should throw an error if the instance is not set', async () => {
      await usingAsync(new Injector(), async (i) => {
        @Injectable({ lifetime: 'explicit' })
        class InstanceClass {}

        expect(() => i.getInstance(InstanceClass)).toThrowError(
          `Cannot instantiate an instance of 'InstanceClass' as it's lifetime is set to 'explicit'. Ensure to initialize it properly`,
        )
      })
    })
  })

  it('Should resolve injectable fields', async () => {
    await usingAsync(new Injector(), async (i) => {
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
  })

  it('Should resolve injectable fields recursively', async () => {
    await usingAsync(new Injector(), async (i) => {
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

    await expect(async () => await i[Symbol.asyncDispose]()).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: There was an error during disposing '1' global disposable objects: Error: :(]`,
    )
  })

  it('Should throw if failed to dispose async one or more entries', async () => {
    expect.assertions(1)

    @Injectable({ lifetime: 'singleton' })
    class TestDisposableThrows implements AsyncDisposable {
      public async [Symbol.asyncDispose]() {
        throw Error(':(')
      }
    }

    const i = new Injector()
    i.getInstance(TestDisposableThrows)

    await expect(async () => await i[Symbol.asyncDispose]()).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: There was an error during disposing '1' global disposable objects: Error: :(]`,
    )
  })

  it('Should dispose cached entries on dispose and tolerate non-disposable ones', async () => {
    const doneCallback = vi.fn()
    @Injectable({ lifetime: 'explicit' })
    class TestDisposable implements Disposable {
      public [Symbol.dispose]() {
        doneCallback()
      }
    }
    @Injectable({ lifetime: 'explicit' })
    class TestInstance {}

    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance(new TestDisposable())
      i.setExplicitInstance(new TestInstance())
    })
    expect(doneCallback).toBeCalledTimes(1)
  })

  it('Remove should remove an entity from the cached instance list', async () => {
    await usingAsync(new Injector(), async (i) => {
      @Injectable({ lifetime: 'scoped' })
      class InjectableClass {}

      i.setExplicitInstance({}, InjectableClass)
      i.remove(InjectableClass)
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
