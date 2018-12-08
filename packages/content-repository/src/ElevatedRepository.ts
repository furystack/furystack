import { IApi, IPhysicalStore, LoggerCollection } from "@furystack/core";
import { Constructable, Injectable } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Brackets, createConnection, getConnectionManager, getManager, In } from "typeorm";
import { AspectManager } from "./AspectManager";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import { DefaultAspects } from "./DefaultAspects";
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

    public async Find<T>(options: {data: Partial<T>, contentType?: Constructable<T>, aspectName: string, top?: number, skip?: number}): Promise<Array<ISavedContent<T>>> {
        let query = this.GetManager()
            .createQueryBuilder(ContentField, "ContentField")
            .where(new Brackets((qb) => {
                for (const key of Object.keys(options.data)) {
                    qb = qb.where(new Brackets((fieldBracket) =>
                        fieldBracket.where("ContentField.Name = :name", { name: key })
                            .andWhere("ContentField.Value = :value", { value: (options.data as any)[key] as string })));
                }
                return qb;
            }));

        if (options.contentType) {
            query = query.innerJoinAndSelect("ContentField.Content", "Content")
                .innerJoin("Content.ContentTypeRef", "contentType")
                .andWhere("contentType.name = :contentTypeName", { contentTypeName: options.contentType.name });
        }

        if (options.top) {
            query = query.take(options.top);
        }

        if (options.skip) {
            query = query.skip(options.skip);
        }

        const result = await query.groupBy("contentId")
            .getMany();

        const contentIds = result.map((c) => c.Content.Id);
        const loadedContents = await this.GetManager().find(Content, {
            where: {
                Id: In(contentIds),
            },
            loadEagerRelations: true,
        });

        return await Promise.all(loadedContents.map(async (c) => this.aspectManager.TransformPlainContent({
            content: c,
            aspect: this.aspectManager.GetAspectOrFail(c, options.aspectName),
            loadRef: (ids) => this.Load({ids, aspectName: DefaultAspects.Expanded}),
        }) as any as ISavedContent<T>));
    }

    public async Create<T>(options: {contentType: Constructable<T>, data: T}): Promise<ISavedContent<T>> {
        const contentTypeName = options.contentType.name;
        return await this.GetManager().transaction(async (tr) => {
            /** */
            const contentType = await tr.findOneOrFail(this.options.models.ContentType, { where: { Name: contentTypeName } });
            const c = tr.create(Content, {
                Type: contentType,
                ContentTypeRef: contentType,
            });

            const savedContent = await tr.save(c);
            const fields = Object.keys(options.data).map((field) => {
                const fieldDef = contentType.Fields && contentType.Fields[field as keyof typeof contentType["Fields"]];
                if (fieldDef && fieldDef.Type !== "Value") {
                    if (fieldDef.Type === "Reference") {
                        /** ToDo: load ref if needed */
                        const fieldValue = (options.data as any)[field] as ISavedContent<{}>;
                        (options.data as any)[field] = JSON.stringify(fieldValue.Id);
                    }
                    if (fieldDef.Type === "ReferenceList") {
                        const fieldValue = (options.data as any)[field] as Array<ISavedContent<{}>>;
                        (options.data as any)[field] = JSON.stringify(fieldValue.map((f) => f.Id));
                    }
                }
                return (tr.create(ContentField, {
                    Name: field,
                    Value: (options.data as any)[field],
                    Content: savedContent,
                }) as ContentField);
            });
            const savedFields = await tr.save(fields);
            await tr.createQueryBuilder()
                .relation(Content, "Fields")
                .of(savedContent)
                .add(savedFields);
            const reloaded = await this.Load<T>({contentType: options.contentType, ids: [savedContent.Id], aspectName: DefaultAspects.Details});
            return reloaded[0];
        });
    }

    public async Load<T>(options: {contentType?: Constructable<T>, ids: number[], aspectName: string}): Promise<Array<ISavedContent<T>>> {
        const content = await this.GetManager()
            .find(Content, {
                where: {
                    Id: In(options.ids),
                },
                loadEagerRelations: true,
            });

        return await Promise.all(content.map(async (c) =>
            this.aspectManager.TransformPlainContent<T>({
                content: c,
                aspect: this.aspectManager.GetAspectOrFail(c, options.aspectName),
                loadRef: async (ids) => await this.Load({ids, aspectName: DefaultAspects.Expanded}),
            })));
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

    public GetPhysicalStoreForType = <TM extends ISavedContent<any>>(contentType: Constructable<TM>) => ({
        primaryKey: "Id",
        logger: this.logger,
        add: (data) => this.Create({contentType, data}),
        count: () => this.GetManager().count(contentType),
        dispose: () => (undefined) as any,
        // todo: implement this
        update: (_id, _change) => (undefined) as any,
        get: async (key) => (await this.Load({contentType, ids: [key], aspectName: DefaultAspects.List}))[0],
        // todo: implement this
        remove: () => (undefined) as any,
        filter: (data, aspectName= DefaultAspects.List) => this.Find({data, contentType, aspectName}),
    } as IPhysicalStore<TM>)

    constructor(
        public readonly options: ContentRepositoryConfiguration,
        private readonly logger: LoggerCollection,
        private readonly aspectManager: AspectManager) {
    }
}
