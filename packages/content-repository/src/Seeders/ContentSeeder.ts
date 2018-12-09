import { IdentityService } from "@furystack/http-api";
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
                private readonly identityService: IdentityService) {

    }

    public async EnsureContentExists<T>(contentType: Constructable<T>, findOptions: Partial<T>, instance: T) {
        const existing = (await this.repository.Find<T>({data: findOptions, contentType, aspectName: "Create"}))[0];
        if (!existing) {
            return await this.repository.Create({contentType, data: instance});
        }
        const reloaded = (await this.repository.Load<T>({contentType, ids: [existing.Id], aspectName: "Create"}))[0];
        return reloaded;
    }

    public async SeedSystemContent() {
        await this.repository.activate();
        this.systemContent.VisitorRole = await this.EnsureContentExists(Role, { Name: "Visitor" }, {
            Name: "Visitor",
            DisplayName: "Visitor Role",
            Description: "The user is not authenticated",
        });

        this.systemContent.AuthenticatedRole = await this.EnsureContentExists(Role,  { Name: "Authenticated" }, {
            Name: "Authenticated",
            Description: "The user is authenticated",
            DisplayName: "Authenticated",
        });

        this.systemContent.AdminRole = await this.EnsureContentExists(Role, { Name: "Admin" }, {
            Name: "Admin",
            DisplayName: "Administrator",
            Description: "The user is a global administrator",
        });

        this.systemContent.VisitorUser = await this.EnsureContentExists(User, { Username: "Visitor" }, {
            Username: "Visitor",
            Password: this.identityService.options.hashMethod("Visitor"),
            Roles: [this.systemContent.VisitorRole],
        });
        this.systemContent.AdminUser = await this.EnsureContentExists(User, { Username: "Administrator" }, {
            Username: "Administrator",
            Password: this.identityService.options.hashMethod("admin"),
            Roles: [this.systemContent.AuthenticatedRole, this.systemContent.AdminRole],
        });
    }
}
