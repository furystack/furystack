import { IApi, LoggerCollection } from "@furystack/core";
import { Constructable, Injectable, Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Connection, createConnection, FindOneOptions, In } from "typeorm";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import { DefaultAspects } from "./DefaultAspects";
import * as Models from "./models";
import { Aspect } from "./models";
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
    private connection!: Connection;

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

    private async loadRequired<T>(model: Constructable<T>, findOption: FindOneOptions<T>) {
        const instance = await this.connection.manager.findOne(model, findOption);
        if (!instance) {
            const errorMsg = `Error loading type '${model.name}' - not found with options '${JSON.stringify(findOption)}'`;
            this.logger.Error({
                scope: this.LogScope,
                message: errorMsg,
                data: {
                    model,
                    findOption,
                },
            });
            throw Error(errorMsg);
        }
        return instance;
    }

    private validateAspectUpdate<T>(aspect: Aspect, change: T) {
        const keys = Object.keys(change).filter((key) => Boolean(change[key as keyof T]));
        const missingFields = aspect.AspectFields.filter((f) => f.Required && !f.ReadOnly).filter((f) => keys.indexOf(f.FieldType.Name)  === -1);
        const writeProtectedFields = aspect.AspectFields.filter((f) => f.ReadOnly).filter((f) => keys.indexOf(f.FieldType.Name)  !== -1);
        const missingReferences = aspect.AspectReferences.filter((f) => f.Required && !f.ReadOnly).filter((f) => keys.indexOf(f.ReferenceType.Name)  === -1);
        const writeProtectedReferences = aspect.AspectReferences.filter((r) => r.ReadOnly).filter((r) => keys.indexOf(r.ReferenceType.Name)  !== -1);
        const unknownFields = keys.filter((f) => aspect.AspectFields.findIndex((field) => field.FieldType.Name === f ) === -1 && aspect.AspectReferences.findIndex((ref) => ref.ReferenceType.Name === f));
        return {
            missingFields,
            writeProtectedFields,
            missingReferences,
            writeProtectedReferences,
            unknownFields,
            isValid: Boolean(missingFields.length + writeProtectedFields.length + missingReferences.length + writeProtectedReferences.length + unknownFields.length),
        };
    }

    public async CreateContent<T>(contentCtor: Constructable<T>, content: T) {
        const manager = this.connection.manager;
        const contentType = await this.loadRequired(this.options.models.ContentType, {where: {Name: contentCtor.name}});
        const createAspect = await this.loadRequired(this.options.models.Aspect, {where: {Name: DefaultAspects.Create, ContentType: contentType, relations: ["AspectFields", "AspectFields.FieldType", "AspectReferences", "AspectReferences.ReferenceType"]}});

        const validationResult = this.validateAspectUpdate(createAspect, content);

        if (!validationResult.isValid) {
            const errorMsg = `Error creating content '${contentCtor.name}'. The aspect is invalid`;
            this.logger.Error({
                scope: this.LogScope,
                message: errorMsg,
                data: {contentCtor, content, validationResult},
            });
            throw Error(errorMsg);
        }
        manager.transaction(async (transactionManager) => {
            /** ToDo: inserts */
        });
    }

    constructor(public readonly options: ContentRepositoryConfiguration, private readonly logger: LoggerCollection, injector: Injector) {
        this.injector = new Injector({ owner: this, parent: injector });
    }
}
