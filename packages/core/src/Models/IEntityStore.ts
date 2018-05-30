import { IUser } from "./IUser";

export interface IEntityStore<T, K extends keyof T = keyof T, TFilter = Partial<T>> {
    readonly primaryKey: K;
    update(id: T[this["primaryKey"]], data: T, user: IUser): Promise<void>;
    count(user: IUser): Promise<number>;
    filter(filter: TFilter, user: IUser): Promise<T[]>;
    get(key: T[this["primaryKey"]], user: IUser): Promise<T | undefined>;
}
