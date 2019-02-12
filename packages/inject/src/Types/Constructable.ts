/**
 * Type that defines a type as constructable
 */
export declare type Constructable<T> = (new (...args: any[]) => object) & (new (...args: any[]) => T)
