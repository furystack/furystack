import { LoggerCollection } from "@furystack/core";
import { Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Connection, ConnectionOptions, createConnection } from "typeorm";
import * as Models from "./models";
import { Seeder } from "./Seeder";

export interface IRepositoryOptions {
    /**
     * TypeORM Connection options for managing the Repository data
     * Entities will be overwritten.
     */
    connection: ConnectionOptions;
    injector: Injector;
    logScope: string;
    models: typeof Models;
}

export const defaultRepositoryOptions: IRepositoryOptions = {
    connection: {
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
    },
    injector: Injector.Default,
    logScope: "@furystack/content-repository/ContentRepository",
    models: Models,
};

export class ContentRepository implements IDisposable {
    public async dispose() {
        await this.connection.close();
    }
    public readonly DbEntities = Models;
    private connection!: Connection;

    public GetConnection() {
        return this.connection;
    }

    public readonly Options: IRepositoryOptions;

    private get logger(): LoggerCollection {
        return this.Options.injector.GetInstance(LoggerCollection);
    }

    public async Initialize() {
        await this.initConnection();
    }

    private async initConnection() {
        this.logger.Verbose({
            scope: this.Options.logScope,
            message: "Initializing connection",
        });
        try {
            const modelArray = Object.values(this.Options.models);
            this.connection = await createConnection({
                ...this.Options.connection,
                entities: modelArray,
            });
            await new Seeder({
                injector: this.Options.injector,
                repository: this,
            }).SeedBuiltinEntries();

        } catch (error) {
            this.logger.Fatal({
                scope: this.Options.logScope,
                message: "Failed to initialize repository DB connection.",
                data: { options: this.Options.connection, error },
            });
            throw error;
        }
    }

    constructor(options?: Partial<IRepositoryOptions>) {
        this.Options = {
            ...defaultRepositoryOptions,
            ...options,
        };
    }
}
