import { LoggerCollection } from "@furystack/core";
import { Injector } from "@furystack/inject";
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
}

export class ContentRepository {
    public readonly DbEntities = Models;

    public readonly LogScope = "@furystack/content-repository/ContentRepository";

    private connection!: Connection;

    public GetConnection() {
        return this.connection;
    }

    private get logger(): LoggerCollection {
        return this.options.injector.GetInstance(LoggerCollection);
    }

    private async initConnection() {
        this.logger.Verbose({
            scope: this.LogScope,
            message: "Initializing connection",
        });
        try {
            this.connection = await createConnection({
                ...this.options.connection,
                entities: Object.keys(this.DbEntities).map((key) => (this.DbEntities as any)[key]),
            });

        } catch (error) {
            this.logger.Fatal({
                scope: this.LogScope,
                message: "Failed to initialize repository DB connection.",
                data: { options: this.connection.options, error },
            });
        }
        await new Seeder({
            injector: this.options.injector,
            repository: this,
        }).SeedBuiltinEntries();
    }

    constructor(public readonly options: IRepositoryOptions) {
        this.initConnection();
    }
}
