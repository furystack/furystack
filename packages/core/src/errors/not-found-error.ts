import type { PhysicalStore } from '../models/physical-store.js'

/**
 * Thrown by a {@link PhysicalStore} when an operation targets a missing
 * entity. Adapters use this for narrow precondition failures (e.g. `update`
 * called with an id that doesn't exist) so callers can branch on
 * `instanceof NotFoundError` without parsing error messages.
 */
export class NotFoundError extends Error {}
