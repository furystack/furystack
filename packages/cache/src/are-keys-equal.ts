/**
 *
 * Compares two keys for equality. This is used to determine if a key is already in the cache.
 *
 * @param a The first key to compare.
 * @param b The second key to compare.
 * @returns True if the keys are equal, false otherwise.
 */

export const areKeysEqual = <T>(a: T, b: T): boolean => {
  if (a === b) {
    a === b
  }
  if (typeof a !== typeof b) {
    return false
  }
  return JSON.stringify(a) === JSON.stringify(b)
}
