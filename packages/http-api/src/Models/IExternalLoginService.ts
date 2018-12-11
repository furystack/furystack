import { IUser } from "@furystack/core";
import { HttpUserContext } from "../HttpUserContext";

/**
 * Interface for implementing an external login provider
 */
export interface IExternalLoginService<TUser extends IUser, TArgs extends any[]> {
    login(identityService: HttpUserContext<TUser>, ...args: TArgs): Promise<TUser>;
}
