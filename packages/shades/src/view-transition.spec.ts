import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ViewTransitionConfig } from './view-transition.js'
import { maybeViewTransition, transitionedValue } from './view-transition.js'

describe('maybeViewTransition', () => {
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  const mockStartViewTransition = () => {
    const spy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
      const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
      update?.()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition
    })
    document.startViewTransition = spy as typeof document.startViewTransition
    return spy
  }

  it('should call update directly when config is undefined', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const result = maybeViewTransition(undefined, update)
    expect(update).toHaveBeenCalledTimes(1)
    expect(spy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should call update directly when config is false', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const result = maybeViewTransition(false, update)
    expect(update).toHaveBeenCalledTimes(1)
    expect(spy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should call update directly when startViewTransition is not available', () => {
    const update = vi.fn()
    const result = maybeViewTransition(true, update)
    expect(update).toHaveBeenCalledTimes(1)
    expect(result).toBeUndefined()
  })

  it('should call startViewTransition when config is true and API is available', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const result = maybeViewTransition(true, update)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(result).toBeInstanceOf(Promise)
  })

  it('should use callback form when config is true', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    void maybeViewTransition(true, update)
    expect(spy).toHaveBeenCalledWith(update)
  })

  it('should pass types when config is an object with types', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const config: ViewTransitionConfig = { types: ['slide', 'fade'] }
    void maybeViewTransition(config, update)
    expect(spy).toHaveBeenCalledWith({ update, types: ['slide', 'fade'] })
  })

  it('should use callback form when config object has empty types array', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const config: ViewTransitionConfig = { types: [] }
    void maybeViewTransition(config, update)
    expect(spy).toHaveBeenCalledWith(update)
  })

  it('should use callback form when config object has no types', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const config: ViewTransitionConfig = {}
    void maybeViewTransition(config, update)
    expect(spy).toHaveBeenCalledWith(update)
  })

  it('should return updateCallbackDone promise when transition is started', async () => {
    mockStartViewTransition()
    const update = vi.fn()
    const result = maybeViewTransition(true, update)
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toBeUndefined()
  })
})

describe('transitionedValue', () => {
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  const mockStartViewTransition = () => {
    const spy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
      const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
      update?.()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition
    })
    document.startViewTransition = spy as typeof document.startViewTransition
    return spy
  }

  const createMockUseState = () => {
    const store = new Map<string, unknown>()
    const setters = new Map<string, (v: unknown) => void>()
    const mockUseState = <S>(key: string, initialValue: S): [S, (v: S) => void] => {
      if (!store.has(key)) {
        store.set(key, initialValue)
      }
      const setValue = (v: S) => {
        store.set(key, v)
      }
      setters.set(key, setValue as (v: unknown) => void)
      return [store.get(key) as S, setValue]
    }
    return { mockUseState, store }
  }

  it('should return the value when it equals the displayed value', () => {
    const { mockUseState } = createMockUseState()
    const result = transitionedValue(mockUseState, 'key', 'hello', true)
    expect(result).toBe('hello')
  })

  it('should not call startViewTransition when value has not changed', () => {
    const spy = mockStartViewTransition()
    const { mockUseState } = createMockUseState()
    transitionedValue(mockUseState, 'key', 'hello', true)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should call startViewTransition when value changes and config is truthy', () => {
    const spy = mockStartViewTransition()
    const { mockUseState, store } = createMockUseState()

    transitionedValue(mockUseState, 'key', 'initial', true)
    store.set('key', 'initial')

    transitionedValue(mockUseState, 'key', 'updated', true)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.get('key')).toBe('updated')
  })

  it('should not call startViewTransition when config is falsy', () => {
    const spy = mockStartViewTransition()
    const { mockUseState, store } = createMockUseState()

    transitionedValue(mockUseState, 'key', 'initial', undefined)
    store.set('key', 'initial')

    transitionedValue(mockUseState, 'key', 'updated', undefined)
    expect(spy).not.toHaveBeenCalled()
    expect(store.get('key')).toBe('updated')
  })

  it('should not call startViewTransition when shouldTransition returns false', () => {
    const spy = mockStartViewTransition()
    const { mockUseState, store } = createMockUseState()

    transitionedValue(mockUseState, 'key', 'initial', true, () => false)
    store.set('key', 'initial')

    transitionedValue(mockUseState, 'key', 'updated', true, () => false)
    expect(spy).not.toHaveBeenCalled()
    expect(store.get('key')).toBe('updated')
  })

  it('should call startViewTransition when shouldTransition returns true', () => {
    const spy = mockStartViewTransition()
    const { mockUseState, store } = createMockUseState()

    transitionedValue(mockUseState, 'key', 'initial', true, () => true)
    store.set('key', 'initial')

    transitionedValue(mockUseState, 'key', 'updated', true, () => true)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.get('key')).toBe('updated')
  })

  it('should pass prev and next values to shouldTransition', () => {
    mockStartViewTransition()
    const { mockUseState, store } = createMockUseState()
    const shouldTransition = vi.fn(() => true)

    transitionedValue(mockUseState, 'key', 'initial', true, shouldTransition)
    store.set('key', 'initial')

    transitionedValue(mockUseState, 'key', 'updated', true, shouldTransition)
    expect(shouldTransition).toHaveBeenCalledWith('initial', 'updated')
  })

  it('should default shouldTransition to always true', () => {
    const spy = mockStartViewTransition()
    const { mockUseState, store } = createMockUseState()

    transitionedValue(mockUseState, 'key', 'a', true)
    store.set('key', 'a')

    transitionedValue(mockUseState, 'key', 'b', true)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
