import { readFile as nodeReadFile, writeFile as nodeWriteFile } from "fs";
import { LoggerCollection, LogScopes } from "./Loggers";
import { IPhysicalStore } from "./Models/IPhysicalStore";

export class FileStore<T, K extends keyof T = keyof T> implements IPhysicalStore<T, K> {
    private cache: Map<T[this["primaryKey"]], T> = new Map();
    public tick = setInterval(() => this.saveChanges(), this.tickMs);
    private hasChanges: boolean = false;
    private saveInProgress: boolean = false;

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
                this.writeFile(this.fileName, JSON.stringify(values), (err) => {
                    if (!err) {
                        resolve();
                    } else {
                        this.logger.error(LogScopes.FileStore, "Error when saving store data to file:", err);
                        reject(err);
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
            this.readFile(this.fileName, (err, data) => {
                if (err) {
                    this.logger.error(LogScopes.FileStore, "Error when loading store data from file:", err);
                    reject(err);
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
