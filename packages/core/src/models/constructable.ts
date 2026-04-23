/**
 * A class-like type used to identify a model (entity) by its constructor.
 *
 * Physical stores, repositories and DataSets key their internal registries on
 * the constructor reference, so consumers typically only need to pass the
 * class itself rather than instantiate it.
 *
 * @example
 * ```ts
 * class User { declare id: string; declare name: string }
 * const token: Constructable<User> = User
 * ```
 */
export type Constructable<T> = new (...args: any[]) => T
