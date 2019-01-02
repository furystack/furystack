import { IRole, IUser } from "@furystack/core";
import { Injectable } from "@furystack/inject";

@Injectable()
export class RoleManager<TUser extends IUser, TRole extends IRole> {
    public async HasRole(user: TUser, role: IRole): Promise<boolean> {
        return user.Roles.filter((r) => r.Name === role.Name).length === 1 ? true : false;
    }
}
