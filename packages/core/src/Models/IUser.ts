import { SystemRoles } from "../SystemRoles";
import { IAccessControlItem } from "./IAccessControlItem";
import { IRole } from "./IRole";

export const visitorUser: IUser = {
    Username: "Visitor",
    Roles: [SystemRoles.Visitors],
    Permissions: [],
};

export interface IUser {
    Username: string;
    Roles: IRole[];
    Permissions: IAccessControlItem[];
}
