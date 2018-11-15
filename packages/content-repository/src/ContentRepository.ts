import { IApi, LoggerCollection } from "@furystack/core";
import { Injectable, Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Connection, createConnection } from "typeorm";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import * as Models from "./models";
import { Seeder } from "./Seeder";

@Injectable()
export class ContentRepository implements IDisposable, IApi {
    public async activate() {
        await this.initConnection();
    }
    public async dispose() {
        this.connection && this.connection.isConnected && await this.connection.close();
    }
    public readonly DbEntities = Models;
    private connection?: Connection;

    public GetConnection() {
        return this.connection;
    }

    private async initConnection() {
        this.logger.Verbose({
            scope: this.LogScope,
            message: "Initializing connection",
        });
        try {
            const modelArray = Object.values(this.options.models);
            this.connection = await createConnection({
                ...this.options.connection,
                entities: modelArray,
            });
            await new Seeder({
                injector: this.injector,
                repository: this,
            }).SeedBuiltinEntries();

        } catch (error) {
            this.logger.Fatal({
                scope: this.LogScope,
                message: "Failed to initialize repository DB connection.",
                data: { options: this.options.connection, error },
            });
            throw error;
        }
    }

    private readonly injector: Injector;
    public readonly LogScope = "@furystack/content-repository/ContentRepository";

    constructor(public readonly options: ContentRepositoryConfiguration, private readonly logger: LoggerCollection, injector: Injector) {
        this.injector = new Injector({ owner: this, parent: injector });
    }
}
