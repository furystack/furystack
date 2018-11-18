import { Constructable, Injectable } from "@furystack/inject";
import { ContentRepository } from "../ContentRepository";
import { Role, User } from "../ContentTypes";
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
        return await this.repository.LoadContent<T>(model, existing.Id, "Create");
    }

    public async SeedSystemContent() {
        this.systemContent.VisitorRole = await this.repository.CreateContent(Role, {
            Name: "Visitor",
            Description: "The user is not authenticated",
        });

        this.systemContent.AuthenticatedRole = await this.repository.CreateContent(Role, {
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
    }
}
