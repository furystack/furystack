import { areKeysEqual } from './are-keys-equal'

/**
 * Checks if a key is a subset of another key. Can be used for bulk cache invalidation.
 *
 * @param keyToCheck The key to check
 * @param subset The expected subset
 * @returns True if the key is a subset of the subset, false otherwise.
 */
export const isKeySubsetOf = <T extends unknown[]>(keyToCheck: T, subset: T): boolean => {
  return subset.every((subsetKey, index) => areKeysEqual(subsetKey, keyToCheck[index]))
}
