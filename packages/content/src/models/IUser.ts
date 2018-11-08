import { IRole } from "./IRole";

export interface IUser {
    Id: number;
    Email: string;
    Password: string;
    Roles: IRole[];
    AvatarUrl?: string;
    Username: string;
}
