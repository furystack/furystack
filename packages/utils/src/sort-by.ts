declare global {
  /**
   * Defines an array of elements
   */
  export interface Array<T> {
    /**
     * Returns a promise with a new array of elements that meets the specified async callback
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

Array.prototype.sortBy = function (key, direction = 'asc') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return this.sort((a, b) => compareBy(a, b, key, direction))
}
