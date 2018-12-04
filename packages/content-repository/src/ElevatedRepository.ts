import { IApi, LoggerCollection } from "@furystack/core";
import { Constructable, Injectable } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { createConnection, getConnectionManager, getManager } from "typeorm";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import * as Models from "./models";
import { Content, ContentField, ISavedContent } from "./models";

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

    public async FindContent<T = {}>(data: Partial<T> | string, model: Constructable<T>): Promise<Array<ISavedContent<T>>> {
        /** ToDo: find content of a type with a specified field set or term */
        return [];
    }

    public async CreateContent<T>(data: T): Promise<ISavedContent<T>> {
        const contentTypeName = data.constructor.name;
        return await this.GetManager().transaction(async (tr) => {
            /** */
            const contentType = await tr.findOneOrFail(this.options.models.ContentType, { where: { Name: contentTypeName } });
            const c = tr.create(Content, {
                Type: contentType,
                ContentTypeRef: contentType,
            });

            const savedContent = await tr.save(c);
            const fields = Object.keys(data).map((field) => ({
                Content: savedContent,
                Name: field,
                Value: (data as any)[field],
            } as ContentField));
            await tr.createQueryBuilder()
                .relation(Content, "Fields")
                .of(savedContent)
                .add(fields);
            return Object.assign(data, savedContent);
        });
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
