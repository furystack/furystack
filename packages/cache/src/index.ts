export * from './cache-result.js'
export * from './cache.js'
// `CacheStateManager` is intentionally NOT re-exported. It is an internal
// helper used by `Cache` and its public method signatures may change
// without a major version bump. Deep-import from
// `@furystack/cache/cache-state-manager` if you really need it; the
// module itself remains shipped.
