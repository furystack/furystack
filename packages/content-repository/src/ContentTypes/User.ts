import { IPermission, IRole } from "@furystack/content";
import { IUser } from "@furystack/core";
import { ILoginUser } from "@furystack/http-api";

export class User implements ILoginUser<IUser> {
    public Id: number; public Username: string;
    public Roles: IRole[];
    public Permissions: IPermission[];
    public Password: string;
}
