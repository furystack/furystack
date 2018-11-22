import { IApi, LoggerCollection } from "@furystack/core";
import { Injectable } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { createConnection, getConnectionManager, getManager } from "typeorm";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import * as Models from "./models";

@Injectable()
export class ElevatedRepository implements IDisposable, IApi {
    public async activate() {
        await this.initConnection();
    }
    public async dispose() {
        /** */
    }
    public readonly DbEntities = Models;

    public GetManager() {
        return getManager(this.options.connection.name);
    }

    private async initConnection() {
        this.logger.Verbose({
            scope: this.LogScope,
            message: "Initializing connection",
        });
        try {
            const modelArray = Object.values(this.options.models);

            const cm = getConnectionManager();
            if (this.options.connection.name && !cm.has(this.options.connection.name)) {
                await createConnection({
                    ...this.options.connection,
                    entities: modelArray,
                });
            }

        } catch (error) {
            this.logger.Fatal({
                scope: this.LogScope,
                message: "Failed to initialize repository DB connection.",
                data: { options: this.options.connection, error },
            });
            throw error;
        }
    }
    public readonly LogScope = "@furystack/content-repository/ContentRepository";

    constructor(
        public readonly options: ContentRepositoryConfiguration,
        private readonly logger: LoggerCollection) {
    }
}
