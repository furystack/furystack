import {Injectable } from "@furystack/inject";
import { User } from "./ContentTypes";
import { PermissionType, Role } from "./models";

@Injectable()
export class SystemContent {
    public VisitorUser!: User;
    public AdminUser!: User;
    public VisitorRole!: Role;
    public AuthenticatedRole!: Role;
    public AdminRole!: Role;

    public CanRead!: PermissionType;
    public CanWrite!: PermissionType;

}
