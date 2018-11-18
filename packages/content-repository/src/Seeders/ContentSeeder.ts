import { Constructable, Injectable } from "@furystack/inject";
import { ContentRepository } from "../ContentRepository";
import { Role, User } from "../ContentTypes";
import { PermissionType } from "../models";
import { SystemContent } from "../SystemContent";

@Injectable()
export class ContentSeeder {

    /**
     *
     */
    constructor(private readonly repository: ContentRepository, private systemContent: SystemContent) {

    }

    public async EnsureContentExists<T>(model: Constructable<T>, findOptions: Partial<T>, instance: T) {
        const existing = (await this.repository.findContent<T>(model, "Create", findOptions))[0];
        if (!existing) {
            return await this.repository.CreateContent(model, instance);
        }
        return await this.repository.LoadContent<T>(model, [existing.Id], "Create");
    }

    public async SeedSystemContent() {
        await this.repository.activate();
        this.systemContent.VisitorRole = await this.EnsureContentExists(Role, {Name: "Visitor"}, {
            Name: "Visitor",
            DisplayName: "Visitor Role",
            Description: "The user is not authenticated",
        });

        this.systemContent.AuthenticatedRole = await this.EnsureContentExists(Role, {Name: "Authenticated"}, {
            Name: "Authenticated",
            Description: "The user is authenticated",
        });

        this.systemContent.AdminRole = await this.repository.CreateContent(Role, {
            Name: "Admin",
            Description: "The user is a global administrator",
        });

        this.systemContent.VisitorUser = await this.repository.CreateContent(User, {
            Username: "Visitor",
            Roles: [this.systemContent.VisitorRole],
        });
        this.systemContent.AdminUser = await this.repository.CreateContent(User, {
            Username: "Administrator",
            Roles: [this.systemContent.AuthenticatedRole, this.systemContent.AdminRole],
        });

        this.systemContent.CanRead = await this.repository.CreateContent(PermissionType, {
            Name: "CanRead",
            DisplayName: "Can Read",
            Description: "Permission to read access to a specific content",
            Category: "@furystack/content-repository",
        });

        this.systemContent.CanWrite = await this.repository.CreateContent(PermissionType, {
            Name: "CanWrite",
            DisplayName: "Can Write",
            Description: "Write access to a specific content",
            Category: "@furystack/content-repository",
        });

    }
}
