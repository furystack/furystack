import { IApi, LoggerCollection } from "@furystack/core";
import { Constructable, Injectable } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Brackets, createConnection, DeepPartial, EntityManager, FindOneOptions, getConnectionManager, getManager, In } from "typeorm";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import { DefaultAspects } from "./DefaultAspects";
import * as Models from "./models";
import { Aspect, Content, IContent } from "./models";

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

    public async loadRequired<T>(model: Constructable<T>, findOption: FindOneOptions<T>, manager: EntityManager) {
        const instance = await manager.findOne(model, findOption);
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

    private async validateAspectUpdate<T>(aspect: Aspect, change: T) {
        const keys = Object.keys(change).filter((key) => Boolean(change[key as keyof T]));

        const aspectFields = await aspect.AspectFields;
        const aspectReferences = await aspect.AspectReferences;

        const missingFields = aspectFields
            .filter((f) => f.Required && !f.ReadOnly)
            .filterAsync(async (f) => keys.indexOf((await f.FieldType).Name) === -1);

        const writeProtectedFields = aspectFields
            .filter((f) => f.ReadOnly)
            .filterAsync(async (f) => keys.indexOf((await f.FieldType).Name) !== -1);

        const missingReferences = aspectReferences
            .filter((f) => f.Required && !f.ReadOnly)
            .filterAsync(async (f) => keys.indexOf((await f.ReferenceType).Name) === -1);

        const writeProtectedReferences = aspectReferences
            .filter((r) => r.ReadOnly)
            .filterAsync(async (r) => keys.indexOf((await r.ReferenceType).Name) !== -1);

        const unknownFields = keys
            .filterAsync(async (f) =>
                (await aspectFields.filterAsync(async (field) => (await field.FieldType).Name === f)).length > 0
                &&
                (await aspectReferences.filterAsync(async (ref) => (await ref.ReferenceType).Name === f)).length > 0);

        // todo: unique fields

        return {
            missingFields,
            writeProtectedFields,
            missingReferences,
            writeProtectedReferences,
            unknownFields,
            isValid: !(Boolean(missingFields.length + writeProtectedFields.length + missingReferences.length + writeProtectedReferences.length + unknownFields.length)),
        };
    }

    public async CreateContent<T>(contentCtor: Constructable<T>, contentData: DeepPartial<T>) {
        let content!: Content;
        try {
            await this.GetManager().transaction(async (transactionManager) => {
                // ToDo: User context and permission check

                const contentType = await this.loadRequired(this.options.models.ContentType, { where: { Name: contentCtor.name }, relations: ["JobTypes"] }, transactionManager);
                const createAspect = await this.loadRequired(this.options.models.Aspect, {
                    where: {
                        Name: DefaultAspects.Create, ContentType: contentType,
                    },
                    relations: ["AspectFields", "AspectReferences", "AspectFields.FieldType", "AspectReferences.ReferenceType"],
                }, transactionManager);
                const validationResult = await this.validateAspectUpdate(createAspect, contentData);
                if (!validationResult.isValid) {
                    const errorMsg = `Error creating content '${contentCtor.name}'. The aspect is invalid`;
                    this.logger.Error({
                        scope: this.LogScope,
                        message: errorMsg,
                        data: { contentCtor, contentData, validationResult },
                    });
                    throw Error(errorMsg);
                }

                const newContent = await transactionManager.create(this.options.models.Content, {
                    Type: Promise.resolve(contentType),
                });
                content = await transactionManager.save(newContent);

                /** fields */
                const aspectFields = await createAspect.AspectFields;
                for (const aspectField of aspectFields) {
                    const fieldType = await aspectField.FieldType;
                    const fieldValue = contentData[fieldType.Name as keyof T];
                    if (fieldValue) {
                        const createdField = await transactionManager.create(this.options.models.Field, {
                            Type: Promise.resolve(fieldType),
                            Content: Promise.resolve(content),
                            Value: fieldValue as any as string,
                        });
                        await transactionManager.save(createdField);
                    }
                }

                for (const aspectRef of (await createAspect.AspectReferences)) {
                    const refType = await aspectRef.ReferenceType;
                    const createdReference = await transactionManager.create(this.options.models.Reference, {
                        Type: Promise.resolve(refType),
                        Content: Promise.resolve(content),
                        References: Promise.resolve(contentData[refType.Name as keyof T] as any as Content[]), // ToDo: check? wtf?
                    });
                    await transactionManager.save(createdReference);
                }

                /** todo: jobs from types */
                for (const jobType of (await contentType.JobTypes)) {
                    const newJob = transactionManager.create(this.options.models.Job, {
                        Content: Promise.resolve(content),
                        Completed: jobType.Completed,
                        Description: jobType.Description,
                        DisplayName: jobType.DisplayName,
                        Name: jobType.Name,
                        Permissions: jobType.Permissions,
                    });
                    // ToDo: Fill prerequisites
                    await transactionManager.save(newJob);
                }
            });
        } catch (error) {
            throw error;
        }
        return {
            ...contentData as {},
            Id: content && content.Id,
            Type: contentCtor.name,
        } as IContent<T>;
    }

    public async LoadContent<T>(type: Constructable<T>, ids: number[], aspectName: string) {
        const plainHits = await this.GetManager().find(this.options.models.Content, {
            where: {
                Id: In(ids),
            },
        });
        return Promise.all(plainHits.map(async (hit) => this.parseContent<T>(type, hit, aspectName)));
    }

    private async parseContent<T>(type: Constructable<T>, plainContent: Content, aspectName: string) {
        return {} as T;
    }

    public async findContent<T>(contentType: Constructable<T>, aspectName: string, findOptions: DeepPartial<T>) {
        const findKeys = Object.keys(findOptions);

        const fieldHits = await this.GetManager()
            .createQueryBuilder()
            .select(["Content.Id"])
            .from(this.options.models.Content, "Content")
            .innerJoinAndSelect("Content.Fields", "Field", "Field.contentId=Content.Id")
            .innerJoinAndSelect("Content.Type", "ContentType", "Content.typeId=ContentType.Id")
            .innerJoinAndSelect("Field.Type", "Type", "Field.typeId=Type.Id")
            .where("ContentType.Name = :contentTypeName", { contentTypeName: contentType.name })
            .andWhere(new Brackets((qb) => {
                findKeys.forEach((key) => {
                    qb = qb
                        .andWhere("Type.Name = :key", { key })
                        .andWhere("Field.Value LIKE :value", { value: "%" + (findOptions as any)[key] + "%" });
                });
                return qb;
            }),
            ).groupBy("content.id");
        return await fieldHits.getMany();
    }

    constructor(
        public readonly options: ContentRepositoryConfiguration,
        private readonly logger: LoggerCollection) {
    }
}
