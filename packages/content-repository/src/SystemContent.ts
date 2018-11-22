import {Injectable } from "@furystack/inject";
import { Role, User } from "./ContentTypes";

@Injectable()
export class SystemContent {
    public VisitorUser!: User;
    public AdminUser!: User;
    public VisitorRole!: Role;
    public AuthenticatedRole!: Role;
    public AdminRole!: Role;
}
