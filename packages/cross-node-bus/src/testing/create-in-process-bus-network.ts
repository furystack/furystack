import { InProcessCrossNodeBus } from '../in-process-cross-node-bus.js'
import { MemoryBroker } from '../memory-broker.js'
import type { CrossNodeBusTelemetry } from '../cross-node-bus-telemetry.js'

/**
 * Options accepted by {@link createInProcessBusNetwork}.
 */
export type CreateInProcessBusNetworkOptions = {
  /** Number of buses to mint. Must be a positive integer. */
  count: number
  /** Forwarded to the shared {@link MemoryBroker}. Defaults to 1000. */
  replayWindow?: number
  /**
   * Per-bus topic prefixes. When provided, length must equal `count`. Useful
   * for simulating an N-services × M-nodes deployment against a single
   * shared broker so cross-service eavesdrop can be exercised without an
   * external transport.
   */
  topicPrefixes?: readonly string[]
  /** Per-bus stable node ids. When provided, length must equal `count`. */
  nodeIds?: readonly string[]
  /** Per-bus telemetry sinks. When provided, length must equal `count`. */
  telemetries?: readonly CrossNodeBusTelemetry[]
}

/**
 * Disposable handle returned by {@link createInProcessBusNetwork}. Disposing
 * it tears down every bus and the shared broker in reverse order.
 */
export type InProcessBusNetwork = Disposable & {
  readonly buses: readonly InProcessCrossNodeBus[]
  readonly broker: MemoryBroker
}

/**
 * Mints `count` {@link InProcessCrossNodeBus} instances backed by a single
 * {@link MemoryBroker}. Publishes from any bus reach the others' subscribers
 * exactly as they would over a real transport.
 *
 * @example
 * ```ts
 * using network = createInProcessBusNetwork({ count: 2 })
 * const [a, b] = network.buses
 *
 * using sub = b.subscribe('topic', (message) => {
 *   // …
 * })
 * await a.publish('topic', { hello: 'world' })
 * ```
 */
export const createInProcessBusNetwork = (options: CreateInProcessBusNetworkOptions): InProcessBusNetwork => {
  const { count, replayWindow, topicPrefixes, nodeIds, telemetries } = options
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError(`createInProcessBusNetwork.count must be a positive integer, got ${String(count)}`)
  }
  for (const [name, list] of [
    ['topicPrefixes', topicPrefixes],
    ['nodeIds', nodeIds],
    ['telemetries', telemetries],
  ] as const) {
    if (list !== undefined && list.length !== count) {
      throw new RangeError(`createInProcessBusNetwork.${name} length must equal count (${count}), got ${list.length}`)
    }
  }
  const broker = new MemoryBroker({ replayWindow })
  const buses: InProcessCrossNodeBus[] = []
  for (let index = 0; index < count; index += 1) {
    buses.push(
      new InProcessCrossNodeBus({
        broker,
        nodeId: nodeIds?.[index],
        topicPrefix: topicPrefixes?.[index] ?? '',
        telemetry: telemetries?.[index],
      }),
    )
  }
  return {
    buses,
    broker,
    [Symbol.dispose]: () => {
      for (let index = buses.length - 1; index >= 0; index -= 1) {
        buses[index][Symbol.dispose]()
      }
      broker[Symbol.dispose]()
    },
  }
}
