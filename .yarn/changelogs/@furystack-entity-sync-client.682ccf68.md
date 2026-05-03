<!-- version-type: major -->

# @furystack/entity-sync-client

## 💥 Breaking Changes

### `SyncCacheEntry.lastSeq` is now a string — persisted caches must be invalidated

Propagates the `seq` type change in `@furystack/entity-sync` (see its changelog for the full rationale): `SyncCacheEntry.lastSeq` is now a string opaque token instead of a numeric counter.

**Affected type:**

```typescript
type SyncCacheEntry = {
  subscriptionKey: string
  model: string
  // ❌ Before
  lastSeq: number
  // ✅ After
  lastSeq: string
  data: unknown
  // ...
}
```

**Impact:** Persisted client caches written by previous versions store `lastSeq` as a number. Loading them under this version produces a type-shape mismatch and the resync logic will treat the entry as invalid.

**Migration:**

- The simplest path is to drop the cache store on upgrade — every subscription will resync on first use, no data is lost.
- Apps that want to preserve cached data should run a one-shot migration that rewrites `lastSeq: number` to `lastSeq: String(value)` before the first `EntitySyncService` call.

### Internal `lastSeq?` parameters are now `string`

The internal `EntitySyncService.persistToCache(..., lastSeq?: string)` and the live-subscription tracking (`LiveEntityInternal`, `LiveCollectionInternal`) carry `lastSeq?: string` to match the new wire shape. Apps that subclassed or monkey-patched `EntitySyncService` need to update those signatures.
