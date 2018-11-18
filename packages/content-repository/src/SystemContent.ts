import {Injectable } from "@furystack/inject";
import { User } from "./ContentTypes";
import { Role } from "./models";

@Injectable()
export class SystemContent {
    public VisitorUser!: User;
    public AdminUser!: User;
    public VisitorRole!: Role;
    public AuthenticatedRole!: Role;
    public AdminRole!: Role;

}
