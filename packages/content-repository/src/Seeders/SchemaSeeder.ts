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

        const contentTypesFromDescriptors = await store.getContentTypes(manager);
        await this.seedBuiltinEntries(contentTypesFromDescriptors, manager);
    }

    private async seedBuiltinEntries(contentTypes: ContentType[], m: EntityManager) {
        await m.transaction("SERIALIZABLE", async (transactionManager) => {

            for (const originalContentType of contentTypes) {
                const contentType = await this.stores.contentType.update(originalContentType, transactionManager.getRepository(ContentType));

                const fieldTypes = await originalContentType.FieldTypes;
                for (const fieldType of fieldTypes) {
                    await this.stores.fieldType.updateOnContentType(contentType, fieldType, transactionManager.getRepository(FieldType));
                }

                const refTypes = await originalContentType.ReferenceTypes;
                for (const refType of refTypes) {
                    await this.stores.referenceTypes.updateOnContentType(contentType, refType, transactionManager.getRepository(ReferenceType));
                }

                const aspects = await originalContentType.Aspects;
                for (const aspect of aspects) {
                    await this.stores.aspect.updateOnContentType(contentType, aspect, transactionManager.getRepository(Aspect));
                }
            }

            // await transactionManager.createQueryBuilder()
            //     .insert()
            //     .into(ContentType)
            //     .values(contentTypes)
            //     .execute();
            // for (const ct of contentTypes) {
            //     const contentType = await transactionManager.findOne(ContentType, { where: { Name: ct.Name } });
            //     if (!contentType) {
            //         throw Error(`Content type '${ct.Name}' not found!`);
            //     }

            //     const fieldTypes = (await ct.FieldTypes);
            //     fieldTypes.length && await transactionManager.createQueryBuilder()
            //         .insert()
            //         .into(FieldType)
            //         .values(fieldTypes)
            //         .execute();

            //     const refTypes = (await ct.ReferenceTypes);
            //     if (refTypes.length) {
            //         const result = await transactionManager.createQueryBuilder()
            //             .insert()
            //             .into(ReferenceType)
            //             .values(refTypes)
            //             .execute();

            //         // allowed types
            //         for (const refTypeId of result.identifiers) {
            //             const reloaded = await transactionManager.findOne(ReferenceType, refTypeId);
            //             if (reloaded) {
            //                 const descriptor = (await ct.ReferenceTypes).find((t) => t.Name === reloaded.Name);
            //                 if (descriptor) {
            //                     await transactionManager.createQueryBuilder()
            //                         .relation(ReferenceType, "AllowedTypes")
            //                         .of(reloaded)
            //                         .add(descriptor.AllowedTypes);
            //                 }
            //             }
            //         }

            //     }

            //     const aspects = (await ct.Aspects);
            //     if (aspects.length) {
            //         const result = await transactionManager.createQueryBuilder()
            //             .insert()
            //             .into(Aspect)
            //             .values(aspects)
            //             .execute();

            //         const reloadedAspects = await transactionManager.find(Aspect, {
            //             where: {
            //                 Id: In(result.identifiers.map((i) => i.Id)),
            //             },
            //         });

            //         // tslint:disable-next-line:variable-name
            //         for (const _reloadedAspect of reloadedAspects) {
            //             /** */
            //         }
            //     }

            //     // ToDo: AspectFields and AspectRefs
            // }
        });

    }
}
