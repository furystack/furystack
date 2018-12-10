import { Injectable } from "@furystack/inject";
import { Role, User } from "./ContentTypes";
import { ISavedContent } from "./models";

@Injectable()
export class SystemContent {
    public VisitorRole = { Id: 1000, Name: "Visitor", DisplayName: "Visitor Role"} as ISavedContent<Role>;
    public AuthenticatedRole = { Id: 1001, Name: "Authenticated", DisplayName: "Authenticated Role"} as ISavedContent<Role>;
    public AdminRole = { Id: 1002, Name: "Admin", DisplayName: "Administrator Role"} as ISavedContent<Role>;
    public VisitorUser = { Id: 5000, Username: "Visitor", Password: "", Roles: [this.VisitorRole] } as any as ISavedContent<User>;
    public AdminUser = { Id: 5001, Username: "Admin", Password: "", Roles: [this.AuthenticatedRole, this.AdminRole] } as any as ISavedContent<User>;
}
