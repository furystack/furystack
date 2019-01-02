import { IApi, IPhysicalStore, IUser, LoggerCollection, UserContext } from "@furystack/core";
import { Constructable, Injectable, Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Brackets, createConnection, EntityManager, getConnectionManager, getManager, In } from "typeorm";
import { AspectManager } from "./AspectManager";
import { ContentRepositoryConfiguration } from "./ContentRepositoryConfiguration";
import { DefaultAspects } from "./DefaultAspects";
import * as Models from "./models";
import { Content, ContentField, ISavedContent } from "./models";
import {RoleManager} from "./RoleManager";
import { SystemContent } from "./SystemContent";

@Injectable()
export class BaseRepository implements IDisposable, IApi {
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
        const currentUser = await this.userContext.GetCurrentUser();
        let query = (this.GetManager() as EntityManager)
            .createQueryBuilder(ContentField, "ContentField")
            .where(new Brackets((qb) => {
                for (const key of Object.keys(options.data)) {
                    qb = qb.where(new Brackets((fieldBracket) =>
                        fieldBracket.where("ContentField.Name = :name", { name: key })
                            .andWhere("ContentField.Value = :value", { value: (options.data as any)[key] as string })));
                }
                return qb;
            }))
            .innerJoinAndSelect("ContentField.Content", "Content");

        if (options.contentType) {
            query = query
            .innerJoin("Content.ContentTypeRef", "contentType")
            .andWhere("contentType.name = :contentTypeName", { contentTypeName: options.contentType.name });
        }

        if (!this.roleManager.HasRole(currentUser, this.systemContent.AdminRole)) {
            /** ToDo: add permission checks for content and / or type */
        }

        if (options.top) {
            query = query.take(options.top);
        }

        if (options.skip) {
            query = query.skip(options.skip);
        }

        const result = await query
            .groupBy("contentId")
            .getMany();

        const contentIds = result.filter((c) => c.Content && c.Content.Id).map((c) => c.Content.Id);
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
        const currentUser = await this.userContext.GetCurrentUser();
        return await this.GetManager().transaction(async (tr) => {
            const contentType = await tr.findOneOrFail(this.options.models.ContentType, { where: { Name: contentTypeName } });
            if (!this.roleManager.HasRole(currentUser, this.systemContent.AdminRole)) {
                if (!this.roleManager.HasPermissionForType({user: currentUser, contentType, permission: "Create"})) {
                    throw Error(`No 'Create' permission for content type '${contentTypeName}'`);
                }
            }

            const c = tr.create(Content, {
                Type: contentType,
                ContentTypeRef: contentType,
            });

            const savedContent = await tr.save(c);
            const fields = Object.keys(options.data).map((field) => {
                const fieldDef = contentType.Fields && contentType.Fields[field as keyof typeof contentType["Fields"]];
                if (fieldDef && fieldDef.Type !== "Value") {
                    if (fieldDef.Type === "Reference") {
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
            const reloaded = await this.Load<T>({contentType: options.contentType, ids: [savedContent.Id], aspectName: DefaultAspects.Details, manager: tr});
            return reloaded[0];
        });
    }

    public async Load<T>(options: {contentType?: Constructable<T>, ids: number[], aspectName: string, manager?: EntityManager}): Promise<Array<ISavedContent<T>>> {

        const currentUser = await this.userContext.GetCurrentUser();
        const isAdmin = !this.roleManager.HasRole(currentUser, this.systemContent.AdminRole);

        const content = await (options.manager || this.GetManager())
            .find(Content, {
                where: {
                    Id: In(options.ids),
                },
                loadEagerRelations: true,
            });

        const filtered = await Promise.all(content.filter(async (c) => {
            const contentPermission = await this.roleManager.HasPermissionForContent({user: currentUser, content: c, permission: "Read"});
            const typePermission = options.contentType && await this.roleManager.HasPermissionForType({user: currentUser, permission: "Read", contentType: c.ContentTypeRef});
            return isAdmin || contentPermission || typePermission;
        }));

        return await Promise.all(filtered
                .map(async (c) =>
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

    public async Remove(..._ids: number[]): Promise<void> {
        return await this.GetManager().transaction(async (tr) => {
            await tr.delete(Content, {Id: In(_ids)});
        });
    }

    public async Update<T>(options: {id: number, change: Partial<T>, aspectName?: string}): Promise<ISavedContent<T>> {
        return await this.GetManager().transaction(async (tm) => {
            const aspectName = options.aspectName || DefaultAspects.Edit;
            const existingContent = await tm.findOne(Content, options.id, {loadEagerRelations: true});

            const currentUser = await this.userContext.GetCurrentUser();
            const isAdmin = await this.roleManager.HasRole(currentUser, this.systemContent.AdminRole);

            if (!isAdmin) {
                const contentPermission = existingContent && await this.roleManager.HasPermissionForContent({user: currentUser, content: existingContent, permission: "Write"});
                const typePermission = existingContent && await this.roleManager.HasPermissionForType({user: currentUser, permission: "Write", contentType: existingContent.ContentTypeRef});
                if (!contentPermission && !typePermission) {
                    throw Error(`No 'Write' permission for content :(`);
                }
            }

            if (!existingContent) {
                throw Error(`Content not found with id '${options.id}'`);
            }

            const aspect = this.aspectManager.GetAspectOrFail(existingContent, aspectName);
            const validationResult = this.aspectManager.Validate(existingContent, options.change, aspect);
            if (!validationResult.isValid) {
                throw Error(`Content update is not valid. Details: ${JSON.stringify(validationResult)}`);
            }
            for (const field of existingContent.Fields) {
                const changeValue = options.change[field.Name as keyof T];
                if (changeValue !== field.Value) {
                    field.Value = changeValue && changeValue.toString && changeValue.toString() || null as any;
                    await tm.save(field);
                }
            }
            return (await this.Load({
                ids: [existingContent.Id],
                aspectName: DefaultAspects.Edit,
            }))[0] as ISavedContent<T>;
        });

    }

    public GetPhysicalStoreForType = <TM extends ISavedContent<any>>(contentType: Constructable<TM>) => ({
        primaryKey: "Id",
        logger: this.logger,
        add: (data) => this.Create({contentType, data}),
        count: () => this.GetManager().count(contentType),
        dispose: () => (undefined) as any,
        update: async (id, change) => { await this.Update({id, change}); },
        get: async (key) => (await this.Load({contentType, ids: [key], aspectName: DefaultAspects.List}))[0],
        remove: async (id) => await this.Remove(id),
        filter: (data, aspectName= DefaultAspects.List) => this.Find({data, contentType, aspectName}),
    } as IPhysicalStore<TM>)

    public readonly options: ContentRepositoryConfiguration;
    constructor(
        protected readonly logger: LoggerCollection,
        protected readonly aspectManager: AspectManager,
        protected readonly systemContent: SystemContent,
        protected readonly injector: Injector,
        protected readonly roleManager: RoleManager,
        protected readonly userContext: UserContext<ISavedContent<IUser>>) {
            this.options = this.injector.GetInstance(ContentRepositoryConfiguration);
    }
}
