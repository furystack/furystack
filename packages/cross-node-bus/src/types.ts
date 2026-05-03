/**
 * Message envelope delivered to subscribers and emitted on the wire by every
 * adapter. Adapters refuse messages whose {@link BusMessage.v} they do not
 * recognise — see the rolling-deploy strategy in
 * `docs/internal/cross-node-bus-spike.md` §12.
 */
export type BusMessage = {
  /** Wire-format version. Adapters refuse incompatible versions. */
  readonly v: 1
  /** `nodeId` of the publisher. */
  readonly originId: string
  /** ISO-8601 publish timestamp from the publisher's clock (diagnostic only). */
  readonly emittedAt: string
  /**
   * Adapter-assigned per-topic monotonic id. Optional because non-sequencing
   * adapters do not provide one.
   */
  readonly seq?: string
  /** Caller-supplied payload. Must be JSON-serializable. */
  readonly payload: unknown
}

/**
 * Static description of a transport's behavior. Declared by every adapter
 * and asserted by facades at registration time so misconfigured deployments
 * fail loudly rather than serving stale data.
 */
export type CrossNodeBusCapabilities = {
  /** Messages survive process restarts. */
  readonly persistent: boolean
  /** Replay returns retained messages on demand. */
  readonly replay: boolean
  /** Adapter assigns a server-monotonic {@link BusMessage.seq}. */
  readonly assignsSequence: boolean
}
