import { IApi, LoggerCollection } from "@furystack/core";
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

    public async Find<T>(data: Partial<T>, model?: Constructable<T>, aspectName: string = DefaultAspects.List): Promise<Array<ISavedContent<T>>> {
        /** ToDo: find content of a type with a specified field set or term */
        let query = this.GetManager()
            .createQueryBuilder(ContentField, "ContentField")
            .where(new Brackets((qb) => {
                for (const key of Object.keys(data)) {
                    qb = qb.where(new Brackets((fieldBracket) =>
                        fieldBracket.where("ContentField.Name = :name", { name: key })
                            .andWhere("ContentField.Value = :value", { value: (data as any)[key] as string })));
                }
                return qb;
            }));

        if (model) {
            query = query.innerJoinAndSelect("ContentField.Content", "Content")
                .innerJoin("Content.ContentTypeRef", "contentType")
                .andWhere("contentType.name = :contentTypeName", { contentTypeName: model.name });
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

        return loadedContents.map((c) => this.aspectManager.TransformPlainContent(c, this.aspectManager.GetAspectOrFail(c, aspectName)) as any as ISavedContent<T>);
    }

    public async Create<T>(model: Constructable<T>, data: T): Promise<ISavedContent<T>> {
        const contentTypeName = model.name;
        return await this.GetManager().transaction(async (tr) => {
            /** */
            const contentType = await tr.findOneOrFail(this.options.models.ContentType, { where: { Name: contentTypeName } });
            const c = tr.create(Content, {
                Type: contentType,
                ContentTypeRef: contentType,
            });

            const savedContent = await tr.save(c);
            const fields = Object.keys(data).map((field) => (tr.create(ContentField, {
                Name: field,
                Value: (data as any)[field],
                Content: savedContent,
            }) as ContentField));
            const savedFields = await tr.save(fields);
            await tr.createQueryBuilder()
                .relation(Content, "Fields")
                .of(savedContent)
                .add(savedFields);
            return Object.assign(data, savedContent);
        });
    }

    public async Load<T>(model: Constructable<T>, ids: number[], aspectName: string): Promise<T[]> {
        const content = await this.GetManager()
            .find(Content, {
                where: {
                    Id: In(ids),
                    ContentTypeRef: model.name,
                },
            });
        return content.map((c) => this.aspectManager.TransformPlainContent<T>(c, this.aspectManager.GetAspectOrFail(c, aspectName)));
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
        private readonly logger: LoggerCollection,
        private readonly aspectManager: AspectManager) {
    }
}
