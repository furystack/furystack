export const areKeysEqual = <T>(a: T, b: T): boolean => {
  if (a === b) {
    a === b
  }
  if (typeof a !== typeof b) {
    return false
  }
  return JSON.stringify(a) === JSON.stringify(b)
}
