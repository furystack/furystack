import { IApi, LoggerCollection } from "@furystack/core";
import { UserContextService } from "@furystack/http-api";
import { Constructable, Injectable } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Brackets, createConnection, EntityManager, FindOneOptions, getConnectionManager, getManager, In} from "typeorm";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import { DefaultAspects } from "./DefaultAspects";
import * as Models from "./models";
import { Aspect, Content, IContent } from "./models";

@Injectable()
export class ContentRepository implements IDisposable, IApi {
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

    private async loadRequired<T>(model: Constructable<T>, findOption: FindOneOptions<T>, manager: EntityManager) {
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

    private validateAspectUpdate<T>(aspect: Aspect, change: T) {
        const keys = Object.keys(change).filter((key) => Boolean(change[key as keyof T]));
        const missingFields = aspect.AspectFields.filter((f) => f.Required && !f.ReadOnly).filter((f) => keys.indexOf(f.FieldType.Name) === -1);
        const writeProtectedFields = aspect.AspectFields.filter((f) => f.ReadOnly).filter((f) => keys.indexOf(f.FieldType.Name) !== -1);
        const missingReferences = aspect.AspectReferences.filter((f) => f.Required && !f.ReadOnly).filter((f) => keys.indexOf(f.ReferenceType.Name) === -1);
        const writeProtectedReferences = aspect.AspectReferences.filter((r) => r.ReadOnly).filter((r) => keys.indexOf(r.ReferenceType.Name) !== -1);
        const unknownFields = keys.filter((f) => aspect.AspectFields.findIndex((field) => field.FieldType.Name === f) === -1 && aspect.AspectReferences.findIndex((ref) => ref.ReferenceType.Name === f));

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

    public async CreateContent<T>(contentCtor: Constructable<T>, contentData: Partial<T>) {
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
                const validationResult = this.validateAspectUpdate(createAspect, contentData);
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
                    Type: contentType,
                });
                content = await transactionManager.save(newContent);

                /** fields */
                for (const aspectField of createAspect.AspectFields) {
                    const fieldValue = contentData[aspectField.FieldType.Name as keyof T];
                    if (fieldValue) {
                        const createdField = await transactionManager.create(this.options.models.Field, {
                            Type: aspectField.FieldType,
                            Content: content,
                            Value: fieldValue as any as string,
                        });
                        await transactionManager.save(createdField);
                    }
                }

                for (const aspectRef of createAspect.AspectReferences) {
                    const createdField = await transactionManager.create(this.options.models.Reference, {
                        Type: aspectRef.ReferenceType,
                        Content: content,
                        References: contentData[aspectRef.ReferenceType.Name as keyof T] as any as Content[], // ToDo: check? wtf?
                    });
                    await transactionManager.save(createdField);
                }

                /** todo: jobs from types */
                for (const jobType of contentType.JobTypes) {
                    const newJob = transactionManager.create(this.options.models.Job, {
                        Content: content,
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
        } as T & { Id: number };
    }

    public async LoadContent<T>(type: Constructable<T>, id: number[], aspectName: string) {

        // ToDo: create query with permission checks
        // ToDo2: Generalize and extract raw data to content parser

        const currentUser = await this.userContext.getCurrentUser();

        const contents = this.GetManager()
            .createQueryBuilder()
            .select()
            .from(this.options.models.Content, "Content")
            .innerJoinAndSelect("Content.Fields", "Field", "Field.contentId=Content.Id")
            .innerJoinAndSelect("Content.Type", "ContentType", "Content.typeId=ContentType.Id")
            .innerJoinAndSelect("Field.Type", "Type", "Field.typeId=Type.Id")
            .innerJoinAndSelect("Content.References", "References")
            .innerJoinAndSelect("Content.Permissions", "Permissions")
            .where("Content.Id= :id", {id: In(id)})
            // ToDo: Where permission check
            .getMany();

        // const returneds: T[] = [];
        // const c = await this.GetManager().find(this.options.models.Content, {
        //     where: {
        //         Id: In(id),
        //     },
        //     relations: ["Type", "Fields", "Fields.Type", "References", "References.Type"],
        // });

        // const aspects = await this.GetManager().find(this.options.models.Aspect, {
        //     where: {
        //         ContentType: In(c.map((ct) => ct.Type)),
        //         Name: aspectName,
        //     },
        //     relations: ["AspectFields", "AspectFields.FieldType", "AspectReferences", "AspectReferences.ReferenceType"],
        // });
        // if (!aspects.length) {
        //     // Content Not Found
        //     const errorMsg = `Aspect not found with name '${aspectName}'`;
        //     this.logger.Warning({
        //         scope: this.LogScope,
        //         message: errorMsg,
        //     });
        //     throw Error(errorMsg);
        // }
        // aspects.map((aspect) => {

        //     aspect.AspectFields.map((f) => {
        //         const fieldName = f.FieldType.Name;
        //         const fieldValue = c.Fields.find((field) => field.Type.Name === fieldName);
        //         (returned as any)[fieldName] = fieldValue && fieldValue.Value;
        //     });
        // });
        // return returned;
    }

    public async findContent<T>(contentType: Constructable<T>, aspectName: string, findOptions: Partial<T>) {
        const findKeys = Object.keys(findOptions);

        const fieldHits = await this.GetManager()
            .createQueryBuilder()
            .select(["Content.Id"])
            .from(this.options.models.Content, "Content")
            .innerJoinAndSelect("Content.Fields", "Field", "Field.contentId=Content.Id")
            .innerJoinAndSelect("Content.Type", "ContentType", "Content.typeId=ContentType.Id")
            .innerJoinAndSelect("Field.Type", "Type", "Field.typeId=Type.Id")
            .where("ContentType.Name = :contentTypeName", {contentTypeName: contentType.name})
            .andWhere(new Brackets((qb) => {
                findKeys.forEach((key) => {
                    qb = qb
                        .andWhere("Type.Name = :key", {key})
                        .andWhere("Field.Value LIKE :value", {value: "%" + (findOptions as any)[key] + "%"});
                });
                // return qb;
                return qb;
            }),
            ).groupBy("content.id");
        return await fieldHits.getMany();
    }

    constructor(
        public readonly options: ContentRepositoryConfiguration,
        private readonly logger: LoggerCollection,
        public readonly userContext: UserContextService) {
    }
}
