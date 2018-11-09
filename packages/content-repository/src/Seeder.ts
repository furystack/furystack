import { IPermissionType, IRole, LoggerCollection, SystemPermissions as FSSystemPermissions, SystemRoles as FSSystemRoles } from "@furystack/core";
import { Constructable, Injector } from "@furystack/inject";
import { DeepPartial, FindOneOptions } from "typeorm";
import { ContentDescriptorStore } from "./ContentDescriptorStore";
import { ContentRepository } from "./ContentRepository";
import { ContentRepositoryRoles } from "./ContentRepositoryRoles";
import { ContentType, FieldType, ReferenceType, Role } from "./models";
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

export const getFuryStackSystemRoles = () => {
    return Object.keys(FSSystemRoles).map((key) => ({
        ...(FSSystemRoles as any)[key] as IRole,
    } as Role));
};

export const getContentRepositoryRoles = () => {
    return Object.keys(ContentRepositoryRoles).map((key) => ({
        ...(ContentRepositoryRoles as any)[key] as IRole,
    } as Role));
};

export class Seeder {

    public readonly LogScope = "@furystack/content-repository/seeder";
    private get logger(): LoggerCollection {
        return this.options.injector.GetInstance(LoggerCollection);
    }

    private ensureExists = async<T>(entry: ISeedEntry<T>) => {
        const manager = this.options.repository.GetConnection().manager;
        const found = await manager.findOne(entry.model, entry.findOption);
        if (!found) {
            this.logger.Information({
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

    public async SeedDbEntries(entries: Array<ISeedEntry<any>>) {
        const promises = entries.map((e) => this.ensureExists(e));
        Promise.all(promises);
    }

    public async SeedBuiltinEntries() {

        // ToDo: Import system users and roles

        const fsPermissionImports = getFuryStackSystemPermissions().map(async (p) => await this.ensureExists({
            model: PermissionType,
            findOption: { where: { Name: p.Name } },
            instance: p,
        }));
        await Promise.all(fsPermissionImports);

        const store = this.options.injector.GetInstance(ContentDescriptorStore);
        const structure = Array.from(store.ContentTypeDescriptors.entries()).map(async ([ctor, ctd]) => {
            const contentType = await this.ensureExists({
                model: ContentType,
                findOption: { where: { Name: ctor.name } },
                instance: {
                    Name: ctor.name,
                    DisplayName: ctd.DisplayName,
                    Description: ctd.Description,
                    Category: ctd.Category,
                },
            });

            const fields = Array.from(ctd.Fields.entries()).map(async ([name, fieldDescripior]) => {
                await this.ensureExists({
                    model: FieldType,
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
                });
                // ToDo: Views
            });
            await Promise.all(fields);

            const references = Array.from(ctd.References.entries()).map(async ([name, refDescriptor]) => {
                await this.ensureExists({
                    model: ReferenceType,
                    findOption: { where: { ContentType: contentType, Name: name } },
                    instance: {
                        Name: name,
                        ContentType: contentType,
                        DisplayName: refDescriptor.DisplayName,
                        Category: refDescriptor.Category,
                        Description: refDescriptor.Description,
                    },
                });
                // ToDO: Allowed Types
                // ToDo: Views
            });
            await Promise.all(references);
        });

        await Promise.all(structure);

        // const fsRoleImports = getFuryStackSystemRoles().map(async (r) => await this.ensureExists({
        //     model: Role,
        //     findOption: { where: { Name: r.Name } },
        //     instance: r,
        // }));

        // await Promise.all(fsRoleImports);

        // const fscrRoleImports = getContentRepositoryRoles().map(async (r) => await this.ensureExists({
        //     model: Role,
        //     findOption: { where: { Name: r.Name } },
        //     instance: r,
        // }));

        // await Promise.all(fscrRoleImports);

    }
}
