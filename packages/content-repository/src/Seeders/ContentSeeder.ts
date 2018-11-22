import { Injectable } from "@furystack/inject";
import { ElevatedRepository } from "../ElevatedRepository";
import { SystemContent } from "../SystemContent";

@Injectable()
export class ContentSeeder {

    /**
     *
     */
    constructor(public readonly repository: ElevatedRepository, public systemContent: SystemContent) {

    }

    // public async EnsureContentExists<T>(model: Constructable<T>, findOptions: DeepPartial<T>, instance: DeepPartial<T>) {
    //     const existing = (await this.repository.findContent<T>(model, "Create", findOptions))[0];
    //     if (!existing) {
    //         return await this.repository.CreateContent(model, instance);
    //     }
    //     return (await this.repository.LoadContent<T>(model, [existing.Id], "Create"))[0];
    // }

    // public async SeedSystemContent() {
    //     await this.repository.activate();
    //     this.systemContent.VisitorRole = await this.EnsureContentExists(Role, { Name: "Visitor" }, {
    //         Name: "Visitor",
    //         DisplayName: "Visitor Role",
    //         Description: "The user is not authenticated",
    //     });

    //     this.systemContent.AuthenticatedRole = await this.EnsureContentExists(Role, { Name: "Authenticated" }, {
    //         Name: "Authenticated",
    //         Description: "The user is authenticated",
    //     });

    //     this.systemContent.AdminRole = await this.repository.CreateContent(Role, {
    //         Name: "Admin",
    //         Description: "The user is a global administrator",
    //     });

    //     this.systemContent.VisitorUser = await this.repository.CreateContent(User, {
    //         Username: "Visitor",
    //         Roles: [this.systemContent.VisitorRole],
    //     });
    //     this.systemContent.AdminUser = await this.repository.CreateContent(User, {
    //         Username: "Administrator",
    //         Roles: [this.systemContent.AuthenticatedRole, this.systemContent.AdminRole],
    //     });
    // }
}
