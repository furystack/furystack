import { IAspect, IContentType, IFieldType, IReferenceType } from "@furystack/content";
import { IPermissionType, LoggerCollection, SystemPermissions as FSSystemPermissions } from "@furystack/core";
import { Constructable, Injector } from "@furystack/inject";
import { DeepPartial, EntityManager, FindOneOptions } from "typeorm";
import { ContentDescriptorStore } from "./ContentDescriptorStore";
import { ContentRepository } from "./ContentRepository";
import { IContentTypeDecoratorOptions } from "./Decorators/ContentType";
import { IVisibilityOption } from "./Decorators/Field";
import { IReferenceTypeDecoratorOptions } from "./Decorators/Reference";
import { PermissionType } from "./models/PermissionType";

export interface ISeedEntry<T> {
    model: Constructable<T>;
    findOption: FindOneOptions<T>;
    instance: DeepPartial<T>;
}

export interface ISeederOptions {
    repository: ContentRepository;
    injector: Injector;
}

export const getFuryStackSystemPermissions = () => {
    return Object.keys(FSSystemPermissions).map((key) => {
        return ({
            ...(FSSystemPermissions as any)[key] as IPermissionType,
            Category: "@furystack/core",
        } as PermissionType);
    });
};

// export const getFuryStackSystemRoles = () => {
//     return Object.keys(FSSystemRoles).map((key) => ({
//         ...(FSSystemRoles as any)[key] as IRole,
//     } as Role));
// };

// export const getContentRepositoryRoles = () => {
//     return Object.keys(ContentRepositoryRoles).map((key) => ({
//         ...(ContentRepositoryRoles as any)[key] as IRole,
//     } as Role));
// };

export class Seeder {

    public readonly LogScope = "@furystack/content-repository/seeder";
    private get logger(): LoggerCollection {
        return this.options.injector.GetInstance(LoggerCollection);
    }

    private ensureExists = async<T>(entry: ISeedEntry<T>, manager: EntityManager) => {
        const found = await manager.findOne(entry.model, entry.findOption);
        if (!found) {
            this.logger.Debug({
                scope: this.LogScope,
                message: `Entity '${JSON.stringify(entry.findOption)}' not found, creating...`,
                data: { instance: entry.instance },
            });
            const created = await manager.create(entry.model, entry.instance);
            return await manager.save(created);
        }
        return found;
    }

    constructor(private readonly options: ISeederOptions) {

    }

    public async SeedDbEntries(entries: Array<ISeedEntry<any>>, manager: EntityManager) {
        const promises = entries.map((e) => this.ensureExists(e, manager));
        Promise.all(promises);
    }

    private getContentTypeFromDescriptorEntry(contentTypeDescriptorCtor: Constructable<any>, contentTypeDescriptor: IContentTypeDecoratorOptions | undefined, contentTypes: IContentType[]) {
        const contentType = contentTypes.find((c) => c.Name === contentTypeDescriptorCtor.name);
        if (!contentType) {
            const message = `Content Type '${contentTypeDescriptorCtor.name}' not found!`;
            this.logger.Fatal({
                scope: this.LogScope,
                message,
                data: {
                    contentTypeDescriptorCtor,
                    contentTypeDescriptor,
                },
            });
            throw Error(message);
        }
        return contentType;
    }

    private async ensureViewExists(manager: EntityManager, contentType: IContentType, typeName: "Create" | "List" | "Details", view: IView, contentTypeDescriptor: IContentTypeDecoratorOptions) {
        if (!view) {
            const created = await manager.create(this.options.repository.options.models.View, {
                ContentType: contentType,
            });
            view = created;
            await manager.save(created);
            (contentType as any)[typeName + "View"] = created;
            await manager.save(contentType);
        }

        await Promise.all(Array.from(contentTypeDescriptor.Fields.entries())
            .filter((f) => f[1].Visible !== undefined && f[1].Visible[typeName] !== undefined)
            .map(async (f) => {
                const viewData = (f[1].Visible && f[1].Visible[typeName]) as IVisibilityOption;
                const fieldType = contentType.FieldTypes.find((field) => field.Name === f[0]) as IFieldType;
                return await this.ensureExists({
                    model: this.options.repository.options.models.ViewField,
                    findOption: {
                        where: {
                            FieldType: fieldType.Id,
                            View: view,
                        },
                    },
                    instance: {
                        Category: viewData.Category || f[1].Category || "default",
                        ControlName: viewData.ControlName,
                        FieldType: fieldType.Id as any,
                        ReadOnly: viewData.ReadOnly,
                        Required: viewData.Required,
                        View: (contentType as any)[typeName + "View"] as any,
                        Order: viewData.Order,
                    },
                }, manager);
            }));

        await Promise.all(Array.from(contentTypeDescriptor.References.entries())
            .filter((f) => f[1].Visible !== undefined && f[1].Visible[typeName] !== undefined)
            .map(async (f) => {
                const viewData = (f[1].Visible && f[1].Visible[typeName]) as IVisibilityOption;
                const refType = contentType.ReferenceTypes.find((ref) => ref.Name === f[0]) as IReferenceType;
                return await this.ensureExists({
                    model: this.options.repository.options.models.ViewReference,
                    findOption: {
                        where: {
                            Reference: refType.Id,
                            View: view,
                        },
                    },
                    instance: {
                        Category: viewData.Category || f[1].Category || "default",
                        ControlName: viewData.ControlName,
                        ReferenceType: refType.Id as any,
                        ReadOnly: viewData.ReadOnly,
                        Required: viewData.Required,
                        View: (contentType as any)[typeName + "View"] as any,
                        Order: viewData.Order,
                    },
                }, manager);
            }));

    }

    public async SeedBuiltinEntries() {

        const log = <T>(message: string, data?: T) => this.logger.Debug({
            scope: this.LogScope,
            message,
            data,
        });

        // ToDo: Import system users and roles

        const store = this.options.injector.GetInstance(ContentDescriptorStore);
        const contentTypeDescriptors = Array.from(store.ContentTypeDescriptors.entries());
        const connection = this.options.repository.GetConnection();
        if (!connection) {
            throw Error("Connection not initialized!");
        }
        const manager = connection.manager;

        log("Seeding built-in entries...");
        log("Seeding @furystack System Permissions...");
        const fsPermissionImports = getFuryStackSystemPermissions().map(async (p) => await this.ensureExists({
            model: PermissionType,
            findOption: { where: { Name: p.Name } },
            instance: p,
        }, manager));
        await Promise.all(fsPermissionImports);

        log("Seeding content type structure...");
        const contentTypeStructure = contentTypeDescriptors.map(async ([ctor, ctd]) => {
            const contentType = await this.ensureExists({
                model: this.options.repository.options.models.ContentType,
                findOption: {
                    where: { Name: ctor.name }, relations: [
                        "CreateView",
                        "ListView",
                        "DetailsView",
                    ],
                },
                instance: {
                    Name: ctor.name,
                    DisplayName: ctd.DisplayName,
                    Description: ctd.Description,
                    Category: ctd.Category,
                },
            }, manager);

            const fieldRequests = Array.from(ctd.Fields.entries()).map(async ([name, fieldDescripior]) => {
                return await this.ensureExists({
                    model: this.options.repository.options.models.FieldType,
                    findOption: { where: { ContentType: contentType, Name: name } },
                    instance: {
                        Name: name,
                        ContentType: contentType,
                        DisplayName: fieldDescripior.DisplayName,
                        Category: fieldDescripior.Category,
                        DefaultValue: fieldDescripior.DefaultValue,
                        Description: fieldDescripior.Description,
                        Unique: fieldDescripior.Unique,
                    },
                }, manager);
            });
            contentType.FieldTypes = await Promise.all(fieldRequests);

            const referenceRequests = Array.from(ctd.References.entries()).map(async ([name, refDescriptor]) => {
                return await this.ensureExists({
                    model: this.options.repository.options.models.ReferenceType,
                    findOption: { where: { ContentType: contentType, Name: name } },
                    instance: {
                        Name: name,
                        ContentType: contentType,
                        DisplayName: refDescriptor.DisplayName,
                        Category: refDescriptor.Category,
                        Description: refDescriptor.Description,
                    },
                }, manager);
            });
            contentType.ReferenceTypes = await Promise.all(referenceRequests);
            return contentType;
        });

        const contentTypes = await Promise.all(contentTypeStructure);

        log("Seeding reference types and views...");
        await contentTypeDescriptors.map(async (contentTypeDescriptorEntry) => {
            const [contentTypeDescriptorCtor, contentTypeDescriptor] = contentTypeDescriptorEntry;

            const contentType = this.getContentTypeFromDescriptorEntry(contentTypeDescriptorCtor, contentTypeDescriptor, contentTypes);

            await contentType.ReferenceTypes.map(async (reference) => {
                const referenceDescriptor = contentTypeDescriptor.References.get(reference.Name) as IReferenceTypeDecoratorOptions;
                const allowedTypes = referenceDescriptor.AllowedTypes.map((type) => this.getContentTypeFromDescriptorEntry(type, store.ContentTypeDescriptors.get(type), contentTypes));
                reference.AllowedTypes = allowedTypes;

                await manager.save(reference);
            });

            await this.ensureViewExists(manager, contentType, "Create", contentType.CreateView, contentTypeDescriptor);
            await this.ensureViewExists(manager, contentType, "Details", contentType.DetailsView, contentTypeDescriptor);
            await this.ensureViewExists(manager, contentType, "List", contentType.ListView, contentTypeDescriptor);

        });
    }
}
