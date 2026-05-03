<!-- version-type: major -->

# @furystack/entity-sync

## 💥 Breaking Changes

### `SyncVersion.seq` and `ClientSyncMessage.lastSeq` are now opaque strings

`seq` is no longer a numeric counter assigned by the server — it is now an **opaque, ordered token** assigned by the underlying `@furystack/cross-node-bus` adapter (integer counters in-process, `<ms>-<n>` Redis Stream ids, etc.). Clients **must not** compare seqs lexicographically or numerically; the only safe operations are equality and round-tripping the value back to the server via `lastSeq`.

**Affected types:**

```typescript
type SyncVersion = {
  // ❌ Before
  seq: number
  // ✅ After
  seq: string
  timestamp: string
}

type ClientSyncMessage =
  | { type: 'subscribe-entity'; /* ... */ lastSeq?: string /* was: number */ }
  | { type: 'subscribe-collection'; /* ... */ lastSeq?: string /* was: number */ }
// ...
```

**Impact:** Any code that does arithmetic on `seq` (e.g. `seq + 1`, `seq > previous`) breaks. Any persisted client-side state holding `lastSeq: number` becomes incompatible.

**Migration:**

1. Replace numeric comparisons with equality checks. Adapter-specific ordering, when needed, lives behind the bus's `compareSeq(a, b)` — do not re-implement it.
2. Treat `seq` as a black-box token: store it, send it back, never inspect it.
3. Persisted client caches (e.g. `SyncCacheEntry` in `@furystack/entity-sync-client`) carry `lastSeq` typed as `number` from previous versions and will not load. Either drop the cache on upgrade or write a one-shot migration that converts numeric seqs to their string representation.
