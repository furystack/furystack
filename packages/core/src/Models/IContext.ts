import { Injector } from "@furystack/inject";
import { IRole } from "./IRole";
import { IUser } from "./IUser";

export interface IContext {
    getCurrentUser(): Promise<IUser>;
    isAuthenticated(): Promise<boolean>;
    isAuthorized(...roles: IRole[]): Promise<boolean>;
    getInjector: () => Injector;
}
