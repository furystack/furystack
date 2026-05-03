import type { CrossNodeBus } from '@furystack/cross-node-bus'
import { CrossNodeBusTelemetryToken } from '@furystack/cross-node-bus'
import type { ServiceFactory } from '@furystack/inject'
import { RedisCrossNodeBus, type RedisCrossNodeBusOptions } from './redis-cross-node-bus.js'

/**
 * Options accepted by {@link defineRedisCrossNodeBusAdapter}. `telemetry` is
 * intentionally absent — the factory always injects
 * {@link CrossNodeBusTelemetryToken} from the surrounding scope.
 */
export type DefineRedisCrossNodeBusAdapterOptions = Omit<RedisCrossNodeBusOptions, 'telemetry'>

/**
 * Returns a {@link ServiceFactory} bound to {@link CrossNodeBus}. Override
 * the default in-process binding at boot:
 *
 * ```ts
 * const client = createClient({ url: process.env.REDIS_URL })
 * await client.connect()
 *
 * injector.bind(
 *   CrossNodeBus,
 *   defineRedisCrossNodeBusAdapter({
 *     client,
 *     serviceName: 'svc-a',
 *     topicPrefix: 'svc-a/',
 *     replayWindow: 10_000,
 *   }),
 * )
 * ```
 *
 * The caller still owns the supplied client's connect/quit lifecycle. The
 * adapter `.duplicate()`s the client internally for the blocking `XREAD`
 * loop and quits the duplicate via `onDispose`.
 */
export const defineRedisCrossNodeBusAdapter = (
  options: DefineRedisCrossNodeBusAdapterOptions,
): ServiceFactory<CrossNodeBus> => {
  return ({ inject, onDispose }) => {
    const telemetry = inject(CrossNodeBusTelemetryToken)
    const bus = new RedisCrossNodeBus({ ...options, telemetry })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(async () => bus[Symbol.asyncDispose]())
    return bus
  }
}
