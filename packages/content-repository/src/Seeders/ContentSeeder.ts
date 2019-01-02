import { IUser } from "@furystack/core";
import { HttpAuthenticationSettings } from "@furystack/http-api";
import { Constructable, Injectable } from "@furystack/inject";
import { Role, User } from "../ContentTypes";
import { ElevatedRepository } from "../ElevatedRepository";
import { SystemContent } from "../SystemContent";

@Injectable()
export class ContentSeeder {

    /**
     *
     */
    constructor(private readonly repository: ElevatedRepository,
                private readonly systemContent: SystemContent,
                private readonly authSettings: HttpAuthenticationSettings<IUser>) {
    }

    public async EnsureContentExists<T>(contentType: Constructable<T>, findOptions: Partial<T>, instance: T) {
        const existing = (await this.repository.Find<T>({ data: findOptions, contentType, aspectName: "Create" }))[0];
        if (!existing) {
            return await this.repository.Create({ contentType, data: instance });
        }
        const reloaded = (await this.repository.Load<T>({ contentType, ids: [existing.Id], aspectName: "Create" }))[0];
        return reloaded;
    }

    public async SeedSystemContent() {
        await this.repository.activate();
        const VisitorRole = await this.EnsureContentExists(Role, { Name: "Visitor" }, {
            Name: "Visitor",
            DisplayName: "Visitor Role",
            Description: "The user is not authenticated",
        });

        const AuthenticatedRole = await this.EnsureContentExists(Role, { Name: "Authenticated" }, {
            Name: "Authenticated",
            Description: "The user is authenticated",
            DisplayName: "Authenticated",
        });

        const AdminRole = await this.EnsureContentExists(Role, { Name: "Admin" }, {
            Name: "Admin",
            DisplayName: "Administrator",
            Description: "The user is a global administrator",
        });

        const VisitorUser = await this.EnsureContentExists(User, { Username: "Visitor" }, {
            Username: "Visitor",
            Password: this.authSettings.HashMethod("Visitor"),
            Roles: [this.systemContent.VisitorRole],
            HasRole: () => false,
        });
        const AdminUser = await this.EnsureContentExists(User, { Username: "Administrator" }, {
            Username: "Administrator",
            Password: this.authSettings.HashMethod("admin"),
            Roles: [this.systemContent.AuthenticatedRole, this.systemContent.AdminRole],
            HasRole: () => false,
        });

        this.systemContent.AdminRole = AdminRole;
        this.systemContent.AuthenticatedRole = AuthenticatedRole;
        this.systemContent.VisitorRole = VisitorRole;
        this.systemContent.VisitorUser = VisitorUser;
        this.systemContent.AdminUser = AdminUser;
    }
}
