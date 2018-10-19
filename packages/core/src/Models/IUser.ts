import { SystemRoles } from "../SystemRoles";
import { IAccessControlItem } from "./IAccessControlItem";
import { IRole } from "./IRole";

export const visitorUser: IUser = {
    Id: 1,
    Username: "Visitor",
    Roles: [SystemRoles.Visitors],
    Permissions: [],
};

export interface IUser {
    Id: number;
    Username: string;
    Roles: IRole[];
    Permissions: IAccessControlItem[];
}
