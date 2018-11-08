import { IPermissionType, IRole, LoggerCollection, SystemPermissions as FSSystemPermissions, SystemRoles as FSSystemRoles } from "@furystack/core";
import { Constructable, Injector } from "@furystack/inject";
import { DeepPartial, FindOneOptions } from "typeorm";
import { ContentRepository } from "./ContentRepository";
import { ContentRepositoryRoles } from "./ContentRepositoryRoles";
import { Role } from "./models";
import { Permission } from "./models/Permission";
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
        const found = manager.findOne(entry.model, entry.findOption);
        if (!found) {
            this.logger.Information({
                scope: this.LogScope,
                message: `Entity '${JSON.stringify(entry.findOption)}' not found, creating...`,
                data: { instance: entry.instance },
            });
            const user = await manager.create(entry.model, entry.instance);
            return await manager.save(user);
        }
        return found;
    }

    constructor(private readonly options: ISeederOptions) {

    }

    public async SeedEntries(entries: Array<ISeedEntry<any>>) {
        const promises = entries.map((e) => this.ensureExists(e));
        Promise.all(promises);
    }

    public async SeedBuiltinEntries() {
        const fsPermissionImports = getFuryStackSystemPermissions().map(async (p) => await this.ensureExists({
            model: Permission,
            findOption: { where: { Name: p.Name } },
            instance: p,
        }));
        await Promise.all(fsPermissionImports);

        const fsRoleImports = getFuryStackSystemRoles().map(async (r) => await this.ensureExists({
            model: Role,
            findOption: { where: { Name: r.Name } },
            instance: r,
        }));

        await Promise.all(fsRoleImports);

        const fscrRoleImports = getContentRepositoryRoles().map(async (r) => await this.ensureExists({
            model: Role,
            findOption: { where: { Name: r.Name } },
            instance: r,
        }));

        await Promise.all(fscrRoleImports);
    }
}
