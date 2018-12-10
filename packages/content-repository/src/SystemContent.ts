import { Injectable } from "@furystack/inject";
import { Role, User } from "./ContentTypes";

@Injectable()
export class SystemContent {
    public VisitorRole: Role = { Name: "Visitor", DisplayName: "Visitor Role"};
    public AuthenticatedRole: Role = { Name: "Authenticated", DisplayName: "Authenticated Role"};
    public AdminRole: Role = { Name: "Admin", DisplayName: "Administrator Role"};

    public VisitorUser: User = { Username: "Visitor", Password: "", Roles: [this.VisitorRole] };
    public AdminUser: User = { Username: "Admin", Password: "", Roles: [this.AuthenticatedRole, this.AdminRole] };
}
