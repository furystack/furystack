import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { MatchChainEntry } from '../components/nested-router.js'
import { RouteMatchService } from './route-match-service.js'

describe('RouteMatchService', () => {
  it('should start with an empty match chain', async () => {
    await usingAsync(createInjector(), async (i) => {
      const service = i.get(RouteMatchService)
      expect(service.currentMatchChain.getValue()).toEqual([])
    })
  })

  it('should update the match chain', async () => {
    await usingAsync(createInjector(), async (i) => {
      const service = i.get(RouteMatchService)
      const chain: MatchChainEntry[] = [
        {
          route: { component: () => ({}) as JSX.Element },
          match: { path: '/about', params: {} },
          query: null,
          hash: undefined,
        },
      ]
      service.currentMatchChain.setValue(chain)
      expect(service.currentMatchChain.getValue()).toBe(chain)
    })
  })

  it('should notify subscribers on match chain change', async () => {
    await usingAsync(createInjector(), async (i) => {
      const service = i.get(RouteMatchService)
      const listener = vi.fn()
      using _subscription = service.currentMatchChain.subscribe(listener)

      const chain: MatchChainEntry[] = [
        {
          route: { meta: { title: 'Home' }, component: () => ({}) as JSX.Element },
          match: { path: '/', params: {} },
          query: null,
          hash: undefined,
        },
      ]
      service.currentMatchChain.setValue(chain)

      expect(listener).toHaveBeenCalledWith(chain)
    })
  })

  it('should dispose the observable on injector disposal', async () => {
    const injector = createInjector()
    const service = injector.get(RouteMatchService)
    await injector[Symbol.asyncDispose]()

    expect(() => service.currentMatchChain.setValue([])).toThrow()
  })
})
