import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { MatchChainEntry } from '../components/nested-router.js'

/**
 * Singleton service that exposes the current match chain from the nearest
 * NestedRouter as an observable. Consumers (breadcrumbs, document title,
 * navigation trees) subscribe to this instead of re-running route matching.
 */
export interface RouteMatchService {
  readonly currentMatchChain: ObservableValue<MatchChainEntry[]>
}

export const RouteMatchService: Token<RouteMatchService, 'singleton'> = defineService({
  name: '@furystack/shades/RouteMatchService',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const currentMatchChain = new ObservableValue<MatchChainEntry[]>([])
    onDispose(() => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      currentMatchChain[Symbol.dispose]()
    })
    return { currentMatchChain }
  },
})
