export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }

/**
 * Deep-merges plain object branches; non-object values and arrays are
 * replaced wholesale, not merged. `undefined` values in a source skip the
 * key (the target's value is preserved). Returns a new top-level object.
 */
export const deepMerge = <T>(target: T, ...sources: Array<DeepPartial<T> | undefined>) => {
  if (!sources.length) {
    return target
  }
  const merged = { ...target }
  for (const source of sources) {
    if (!source) {
      continue
    }
    const keys = Object.keys(source) as Array<keyof T>
    for (const key of keys) {
      if (!(source[key] instanceof Array) && typeof source[key] === 'object' && typeof target[key] === 'object') {
        merged[key] = deepMerge(target[key], source[key])
      } else if (source[key] !== undefined) {
        ;(merged[key] as any) = source[key]
      }
    }
  }
  return merged
}
