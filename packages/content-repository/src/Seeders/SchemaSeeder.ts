import { IPermissionType, LoggerCollection, SystemPermissions as FSSystemPermissions } from "@furystack/core";
import { Constructable, Injectable, Injector } from "@furystack/inject";
import { DeepPartial, EntityManager, FindOneOptions } from "typeorm";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { ElevatedRepository } from "../ElevatedRepository";
import { Aspect, ContentType, FieldType, ReferenceType } from "../models";
import { PermissionType } from "../models/PermissionType";
import { AspectStore, ContentTypeStore, FieldTypeStore, ReferenceTypeStore } from "../Store";

export interface ISeedEntry<T> {
    model: Constructable<T>;
    findOption: FindOneOptions<T>;
    instance: DeepPartial<T>;
}

export const getFuryStackSystemPermissions = () => {
    return Object.keys(FSSystemPermissions).map((key) => {
        return ({
            ...(FSSystemPermissions as any)[key] as IPermissionType,
            Category: "@furystack/core",
        } as PermissionType);
    });
};

@Injectable()
export class SchemaSeeder {

    public readonly LogScope = "@furystack/content-repository/seeder";
    private get logger(): LoggerCollection {
        return this.injector.GetInstance(LoggerCollection);
    }

    private async ensureExists<T>(entry: ISeedEntry<T>, manager: EntityManager) {
        const found = await manager.findOne(entry.model, entry.findOption);
        if (!found) {
            this.logger.Debug({
                scope: this.LogScope,
                message: `Entity '${JSON.stringify(entry.findOption)}' not found, creating...`,
                data: { instance: entry.instance },
            });
            try {
                const created = await manager.create(entry.model, entry.instance);
                return await manager.save(created);
            } catch (error) {
                throw error;
            }
        }
        return found;
    }

    private stores = {
        contentType: this.injector.GetInstance(ContentTypeStore),
        fieldType: this.injector.GetInstance(FieldTypeStore),
        aspect: this.injector.GetInstance(AspectStore),
        referenceTypes: this.injector.GetInstance(ReferenceTypeStore),
    };

    constructor(private readonly repository: ElevatedRepository, private readonly injector: Injector) {

    }

    public async SeedBuiltinEntries() {
        await this.repository.activate();
        const log = <T>(message: string, data?: T) => this.logger.Debug({
            scope: this.LogScope,
            message,
            data,
        });

        const store = this.injector.GetInstance(ContentDescriptorStore);
        const manager = this.repository.GetManager();
        log("Seeding built-in entries...");
        log("Seeding @furystack System Permissions...");
        const fsPermissionImports = getFuryStackSystemPermissions().map(async (p) => await this.ensureExists({
            model: PermissionType,
            findOption: { where: { Name: p.Name } },
            instance: p,
        }, manager));
        await Promise.all(fsPermissionImports);
        await this.seedBuiltinEntries(manager, store);
    }

    private async seedBuiltinEntries(m: EntityManager, store: ContentDescriptorStore) {
        await m.transaction("SERIALIZABLE", async (transactionManager) => {

            const contentTypes = await store.getContentTypes(transactionManager);

            for (const originalContentType of contentTypes) {

                const originalDescriptor = Array.from(store.ContentTypeDescriptors.entries()).find((e) =>
                    e[0].name === originalContentType.Name);

                const contentType = await this.stores.contentType.update(originalContentType, transactionManager.getRepository(ContentType));

                const fieldTypes = await originalContentType.FieldTypes;
                for (const fieldType of fieldTypes) {
                    await this.stores.fieldType.updateOnContentType(contentType, fieldType, transactionManager.getRepository(FieldType));
                }

                const refTypes = await originalContentType.ReferenceTypes;
                for (const refType of refTypes) {
                    await this.stores.referenceTypes.updateOnContentType(contentType, refType, transactionManager.getRepository(ReferenceType));
                }

                const aspects = await store.mapAspectsFromContentTypeDescriptor(originalDescriptor as any, transactionManager);
                for (const aspect of aspects) {
                    await this.stores.aspect.updateOnContentType(contentType, aspect.aspect, transactionManager.getRepository(Aspect));
                    await this.stores.aspect.updateAspectFields(aspect.aspect, aspect.AspectFields || [], transactionManager);
                }
            }

        });

    }
}
