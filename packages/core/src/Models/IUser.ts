import { SystemRoles } from "../SystemRoles";
import { IRole } from "./IRole";

export const visitorUser: IUser = {
    Username: "Visitor",
    Roles: [SystemRoles.Visitors],
};

export interface IUser {
    Username: string;
    Roles: IRole[];
}
