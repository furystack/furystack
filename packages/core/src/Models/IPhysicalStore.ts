export interface IPhysicalStore<T, K extends keyof T = keyof T, TFilter = Partial<T>> {
    readonly primaryKey: K;
    update(id: T[this["primaryKey"]], data: T): Promise<void>;
    count(): Promise<number>;
    filter(filter: TFilter): Promise<T[]>;
    get(key: T[this["primaryKey"]]): Promise<T | undefined>;
}
