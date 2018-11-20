import { Injectable } from "@furystack/inject";
import { ConnectionOptions } from "typeorm";
import * as Models from "./models";

@Injectable()
export class ContentRepositoryConfiguration {
    /**
     * TypeORM Connection options for managing the Repository data
     * Entities will be overwritten.
     */
    public connection: ConnectionOptions = {
        name: "FuryStackContentReposiroty",
        type: "sqlite",
        // database: ":memory:",
        database: "./db.sqlite",
        synchronize: true,
        logging: true,
    };
    public models: typeof Models = Models;
}
