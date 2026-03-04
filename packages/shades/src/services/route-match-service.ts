import { Injectable } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { MatchChainEntry } from '../components/nested-router.js'

/**
 * Singleton service that exposes the current match chain from the nearest
 * NestedRouter as an observable. Consumers (breadcrumbs, document title,
 * navigation trees) subscribe to this instead of re-running route matching.
 */
@Injectable({ lifetime: 'singleton' })
export class RouteMatchService implements Disposable {
  public readonly currentMatchChain = new ObservableValue<MatchChainEntry[]>([])

  public [Symbol.dispose]() {
    this.currentMatchChain[Symbol.dispose]()
  }
}
