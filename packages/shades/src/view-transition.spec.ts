import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ViewTransitionConfig } from './view-transition.js'
import { maybeViewTransition } from './view-transition.js'

describe('maybeViewTransition', () => {
  afterEach(() => {
    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  const mockStartViewTransition = () => {
    const spy = vi.fn((opts: StartViewTransitionOptions) => {
      opts.update?.()
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

  it('should not pass types when config is true', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    void maybeViewTransition(true, update)
    expect(spy).toHaveBeenCalledWith({ update })
  })

  it('should pass types when config is an object with types', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const config: ViewTransitionConfig = { types: ['slide', 'fade'] }
    void maybeViewTransition(config, update)
    expect(spy).toHaveBeenCalledWith({ update, types: ['slide', 'fade'] })
  })

  it('should not pass types when config object has empty types array', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const config: ViewTransitionConfig = { types: [] }
    void maybeViewTransition(config, update)
    expect(spy).toHaveBeenCalledWith({ update })
  })

  it('should not pass types when config object has no types', () => {
    const spy = mockStartViewTransition()
    const update = vi.fn()
    const config: ViewTransitionConfig = {}
    void maybeViewTransition(config, update)
    expect(spy).toHaveBeenCalledWith({ update })
  })

  it('should return updateCallbackDone promise when transition is started', async () => {
    mockStartViewTransition()
    const update = vi.fn()
    const result = maybeViewTransition(true, update)
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toBeUndefined()
  })
})
