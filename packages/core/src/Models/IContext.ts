import { Injector } from "@furystack/inject";
import { IUser } from "./IUser";

export interface IContext {
    getCurrentUser(): Promise<IUser>;
    isAuthenticated(): Promise<boolean>;
    isAuthorized(...claims: string[]): Promise<boolean>;
    getInjector: () => Injector;
}
