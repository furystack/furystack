import { IContentType } from "@furystack/content";
import { IPermissionType, LoggerCollection, SystemPermissions as FSSystemPermissions } from "@furystack/core";
import { Constructable, Injectable, Injector } from "@furystack/inject";
import { DeepPartial, EntityManager, FindOneOptions } from "typeorm";
import { ContentDescriptorStore } from "./ContentDescriptorStore";
import { ContentRepository } from "./ContentRepository";
import { User } from "./ContentTypes";
import { IContentTypeDecoratorOptions } from "./Decorators/ContentType";
import { IVisibilityOption } from "./Decorators/Field";
import { IReferenceTypeDecoratorOptions, IReferenceVisibilityOption } from "./Decorators/Reference";
import { DefaultAspects } from "./DefaultAspects";
import { Role } from "./models";
import { PermissionType } from "./models/PermissionType";

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
export class Seeder {

    public readonly LogScope = "@furystack/content-repository/seeder";
    private get logger(): LoggerCollection {
        return this.injector.GetInstance(LoggerCollection);
    }

    private ensureExists = async<T>(entry: ISeedEntry<T>, manager: EntityManager) => {
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

    constructor(private readonly repository: ContentRepository, private readonly injector: Injector) {

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

    private async createAspects(manager: EntityManager, contentType: IContentType, contentTypeDescriptor: IContentTypeDecoratorOptions) {
        const aspectNames = new Set<string>([...Object.keys(DefaultAspects)]);
        contentTypeDescriptor.Fields.forEach((f) => {
            const fieldAspects = f.Aspects ? Object.keys(f.Aspects) : [];
            fieldAspects.forEach((fa) => aspectNames.add(fa));
        });

        contentTypeDescriptor.References.forEach((r) => {
            const refAspects = r.Aspects ? Object.keys(r.Aspects) : [];
            refAspects.forEach((ra) => aspectNames.add(ra));
        });

        if (!contentType.Aspects) {
            contentType.Aspects = [];
        }

        const definedAspects = contentType.Aspects.map((a) => a.Name);
        const aspectsToCreate = Array.from(aspectNames).filter((name) => definedAspects.indexOf(name) === -1);

        for (const aspectName of aspectsToCreate) {
            const created = await this.ensureExists({
                model: this.repository.options.models.Aspect,
                findOption: {
                    where: {
                        ContentType: contentType,
                        Name: aspectName,
                    },
                }, instance: {
                    ContentType: contentType,
                    Name: aspectName,
                },
            }, manager);
            contentType.Aspects.push(created);
        }

        for (const [fieldName, fieldDescriptor] of Array.from(contentTypeDescriptor.Fields.entries())) {
            if (!fieldDescriptor.Aspects) { return; }
            const names = Object.keys(fieldDescriptor.Aspects);
            names.map(async (aspectName) => {
                const aspectDescriptor = (fieldDescriptor.Aspects as any)[aspectName] as IVisibilityOption;
                const aspect = contentType.Aspects.find((a) => a.Name === aspectName);
                const fieldType = contentType.FieldTypes.find((f) => f.Name === fieldName);
                await this.ensureExists({
                    model: this.repository.options.models.AspectField,
                    instance: {
                        Aspect: aspect,
                        Category: aspectDescriptor.Category,
                        FieldType: fieldType,
                        ControlName: aspectDescriptor.ControlName,
                        Order: aspectDescriptor.Order,
                        ReadOnly: aspectDescriptor.ReadOnly,
                        Required: aspectDescriptor.Required,
                    },
                    findOption: {
                        where: {
                            Aspect: aspect,
                            FieldType: fieldType,
                        },
                    },
                }, manager);
            });
        }

        for (const [refName, refDescriptor] of Array.from(contentTypeDescriptor.References.entries())) {
            if (!refDescriptor.Aspects) { return; }
            const names = Object.keys(refDescriptor.Aspects);
            names.map(async (aspectName) => {
                const aspectDescriptor = (refDescriptor.Aspects as any)[aspectName] as IReferenceVisibilityOption;
                const aspect = contentType.Aspects.find((a) => a.Name === aspectName);
                const referenceType = contentType.ReferenceTypes.find((f) => f.Name === refName);
                await this.ensureExists({
                    model: this.repository.options.models.AspectReference,
                    instance: {
                        Aspect: aspect,
                        Category: aspectDescriptor.Category,
                        ReferenceType: referenceType,
                        ControlName: aspectDescriptor.ControlName,
                        Order: aspectDescriptor.Order,
                        ReadOnly: aspectDescriptor.ReadOnly,
                        Required: aspectDescriptor.Required,
                    },
                    findOption: {
                        where: {
                            Aspect: aspect,
                            ReferenceType: referenceType,
                        },
                    },
                }, manager);
            });
        }
    }

    public async SeedBuiltinEntries() {
        await this.repository.activate();
        const log = <T>(message: string, data?: T) => this.logger.Debug({
            scope: this.LogScope,
            message,
            data,
        });

        // ToDo: Import system users and roles

        const store = this.injector.GetInstance(ContentDescriptorStore);
        const contentTypeDescriptors = Array.from(store.ContentTypeDescriptors.entries());
        const manager = this.repository.GetManager();

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
                model: this.repository.options.models.ContentType,
                findOption: {
                    where: { Name: ctor.name }, relations: [
                        "Aspects",
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
                    model: this.repository.options.models.FieldType,
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
                    model: this.repository.options.models.ReferenceType,
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
        for (const contentTypeDescriptorEntry of contentTypeDescriptors) {
            const [contentTypeDescriptorCtor, contentTypeDescriptor] = contentTypeDescriptorEntry;

            const contentType = this.getContentTypeFromDescriptorEntry(contentTypeDescriptorCtor, contentTypeDescriptor, contentTypes);

            await contentType.ReferenceTypes.map(async (reference) => {
                const referenceDescriptor = contentTypeDescriptor.References.get(reference.Name) as IReferenceTypeDecoratorOptions;
                const allowedTypes = referenceDescriptor.AllowedTypes.map((type) => this.getContentTypeFromDescriptorEntry(type, store.ContentTypeDescriptors.get(type), contentTypes));
                reference.AllowedTypes = allowedTypes;

                await manager.save(reference);
            });

            await this.createAspects(manager, contentType, contentTypeDescriptor);
        }

        const visitorRole = await this.repository.CreateContent(Role, {
            Name: "Visitor",
            Description: "The user is not authenticated",
        });

        const authenticatedRole = await this.repository.CreateContent(Role, {
            Name: "Authenticated",
            Description: "The user is authenticated",
        });

        const adminRole = await this.repository.CreateContent(Role, {
            Name: "Admin",
            Description: "The user is a global administrator",
        });

        await this.repository.CreateContent(User, {
            Username: "Visitor",
            Roles: [visitorRole],
        });
        await this.repository.CreateContent(User, {
            Username: "Administrator",
            Roles: [authenticatedRole, adminRole],
        });

    }
}
