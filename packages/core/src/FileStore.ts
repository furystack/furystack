import { readFile as nodeReadFile, writeFile as nodeWriteFile } from "fs";
import { LoggerCollection, LogScopes } from "./Loggers";
import { IPhysicalStore } from "./Models/IPhysicalStore";

export class FileStore<T, K extends keyof T = keyof T> implements IPhysicalStore<T, K> {
    private cache: Map<T[this["primaryKey"]], T> = new Map();
    public tick = setInterval(() => this.saveChanges(), this.tickMs);
    private hasChanges: boolean = false;
    private saveInProgress: boolean = false;

    public get = async (key: T[this["primaryKey"]]) => this.cache.get(key);

    public async add(data: T) {
        if (this.cache.has(data[this.primaryKey])) {
            throw new Error("Item with the same key already exists");
        }
        this.update(data[this.primaryKey], data);
        return data;
    }

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

    private async saveChanges() {
        if (this.saveInProgress || !this.hasChanges) {
            return;
        }
        this.saveInProgress = true;
        const values: T[] = [];
        for (const key of this.cache.keys()) {
            values.push(this.cache.get(key) as T);
        }
        try {
            await new Promise((resolve, reject) => {
                this.writeFile(this.fileName, JSON.stringify(values), (error) => {
                    if (!error) {
                        resolve();
                    } else {
                        this.logger.Error({
                            scope: LogScopes.FileStore,
                            message: "Error when saving store data to file:",
                            data: {error},
                        });
                        reject(error);
                    }
                });
            });
            this.hasChanges = false;
        } finally {
            this.saveInProgress = false;
        }
    }

    public dispose() {
        this.saveChanges();
        clearInterval(this.tick);
    }

    public async reloadData() {
        await new Promise((resolve, reject) => {
            this.readFile(this.fileName, (error, data) => {
                if (error) {
                    this.logger.Error({
                        scope: LogScopes.FileStore,
                        message: "Error when loading store data from file:",
                        data: {error},
                    });
                    reject(error);
                } else {
                    this.cache.clear();
                    const json = JSON.parse(data.toString()) as T[];
                    for (const user of json) {
                        this.cache.set(user[this.primaryKey], user);
                    }
                    resolve();
                }
            });
        });
    }

    public async update(id: T[this["primaryKey"]], data: T) {
        this.cache.set(id, data);
        this.hasChanges = true;
    }

    constructor(private readonly fileName: string,
                public readonly primaryKey: K,
                public readonly tickMs = 10000,
                private readFile = nodeReadFile,
                private writeFile = nodeWriteFile,
                public logger = new LoggerCollection(),
    ) {

    }

}
