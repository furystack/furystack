import { LoggerCollection } from "./Loggers";
import { IPhysicalStore } from "./Models/IPhysicalStore";

export class InMemoryStore<T, K extends keyof T = keyof T> implements IPhysicalStore<T, K> {

    public async add(data: T): Promise<T> {
        if (this.cache.has(data[this.primaryKey])) {
            throw new Error("Item with the primary key already exists.");
        }
        this.cache.set(data[this.primaryKey], data);
        return data;
    }

    private cache: Map<T[this["primaryKey"]], T> = new Map();
    public get = async (key: T[this["primaryKey"]]) => this.cache.get(key);

    public filter = async (filter: Partial<T>) => [...this.cache.values()].filter((item) => {
        for (const key in filter) {
            if (filter[key] !== (item as any)[key]) {
                return false;
            }
        }
        return true;
    })

    public async count() {
        return this.cache.size;
    }

    public async update(id: T[this["primaryKey"]], data: T) {
        this.cache.set(id, data);
    }

    public dispose() {
        /** */
    }

    constructor(private readonly fileName: string,
                public readonly primaryKey: K,
                public readonly tickMs = 10000,
                public logger = new LoggerCollection(),
    ) {

    }

}
