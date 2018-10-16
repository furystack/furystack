import { IUser } from "@furystack/core";
import { IdentityService, ILoginUser } from "..";

/**
 * Interface for implementing an external login provider
 */
export interface IExternalLoginService<TUser extends ILoginUser<IUser>, TArgs extends any[]> {
    login(identityService: IdentityService<TUser>, ...args: TArgs): Promise<TUser>;
}
