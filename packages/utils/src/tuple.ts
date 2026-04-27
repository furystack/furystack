/**
 * Forces tuple inference for a list of string literals.
 * `tuple('a', 'b')` infers `['a', 'b']` rather than `string[]`.
 */
export const tuple = <T extends string[]>(...args: T) => args
