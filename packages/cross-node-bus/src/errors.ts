import type { CrossNodeBusCapabilities } from './types.js'

/**
 * Thrown synchronously by {@link CrossNodeBus.replay} when `fromSeq` falls
 * outside the adapter's retained window. Facades catch this and fall back
 * to a full-snapshot path.
 */
export class ReplayWindowExceededError extends Error {
  public readonly topic: string
  public readonly fromSeq: string
  public readonly oldestRetainedSeq: string | undefined

  constructor(topic: string, fromSeq: string, oldestRetainedSeq: string | undefined) {
    super(
      `Replay window exceeded for topic "${topic}": requested fromSeq=${fromSeq}, oldest retained=${
        oldestRetainedSeq ?? 'none'
      }`,
    )
    this.name = 'ReplayWindowExceededError'
    this.topic = topic
    this.fromSeq = fromSeq
    this.oldestRetainedSeq = oldestRetainedSeq
  }
}

/**
 * Thrown synchronously by an adapter when a caller invokes a method that
 * requires a capability the adapter does not advertise.
 */
export class UnsupportedCapabilityError extends Error {
  public readonly capability: keyof CrossNodeBusCapabilities

  constructor(capability: keyof CrossNodeBusCapabilities) {
    super(`Adapter does not support capability: ${capability}`)
    this.name = 'UnsupportedCapabilityError'
    this.capability = capability
  }
}
