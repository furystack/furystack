import type { ServiceFactory } from '@furystack/inject'
import { CrossNodeBusTelemetryToken } from './cross-node-bus-telemetry.js'
import { InProcessCrossNodeBus, type InProcessCrossNodeBusOptions } from './in-process-cross-node-bus.js'
import type { CrossNodeBus } from './cross-node-bus.js'

/**
 * Options accepted by {@link defineInProcessCrossNodeBus}. `telemetry` is
 * intentionally absent — the factory always injects
 * {@link CrossNodeBusTelemetryToken} from the surrounding scope.
 */
export type DefineInProcessCrossNodeBusOptions = Omit<InProcessCrossNodeBusOptions, 'telemetry'>

/**
 * Returns a {@link ServiceFactory} bound to {@link CrossNodeBus}. Use it to
 * override the default factory at boot:
 *
 * ```ts
 * injector.bind(
 *   CrossNodeBus,
 *   defineInProcessCrossNodeBus({ topicPrefix: 'svc-a/' }),
 * )
 * ```
 *
 * Mirrors the `defineXxxCrossNodeBusAdapter` shape future transport
 * adapters expose. Wires telemetry and disposal into the surrounding
 * injector scope.
 */
export const defineInProcessCrossNodeBus = (
  options: DefineInProcessCrossNodeBusOptions = {},
): ServiceFactory<CrossNodeBus> => {
  return ({ inject, onDispose }) => {
    const telemetry = inject(CrossNodeBusTelemetryToken)
    const bus = new InProcessCrossNodeBus({ ...options, telemetry })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => bus[Symbol.dispose]())
    return bus
  }
}
