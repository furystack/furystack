import type { PhysicalStore } from '../models/physical-store.js'

/**
 * Thrown when a {@link PhysicalStore} adapter does not support a given
 * operation against its backing storage (e.g. `find` against a key/value
 * store). Adapters should throw this at call time rather than at
 * construction so the rest of the surface remains usable.
 */
export class NotSupportedError extends Error {}
