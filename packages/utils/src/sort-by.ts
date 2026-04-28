declare global {
  export interface Array<T> {
    /**
     * Sorts the array in place by `field`. Direction defaults to `'asc'`.
     * Mutates and returns the array (matches `Array.prototype.sort`).
     */
    sortBy: (field: keyof T, direction?: 'asc' | 'desc') => T[]
  }
}

export const compareBy = <T, K extends keyof T>(entity1: T, entity2: T, field: K, direction: 'asc' | 'desc') => {
  const a = direction === 'asc' ? entity1 : entity2
  const b = direction === 'asc' ? entity2 : entity1
  if (a[field] < b[field]) {
    return -1
  }
  if (a[field] > b[field]) {
    return 1
  }
  return 0
}

Array.prototype.sortBy = function <T, K extends keyof T>(key: K, direction: 'asc' | 'desc' = 'asc'): T[] {
  return this.sort((a, b) => compareBy(a, b, key, direction))
}
