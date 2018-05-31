import { IEntityStore } from "./IEntityStore";
import { IUser } from "./IUser";

export interface IContext {
    getCurrentUser(): Promise<IUser>;
    isAuthenticated(): Promise<boolean>;
    isAuthorized(...claims: string[]): Promise<boolean>;
    getEntityStore: <T>(type: { new(...args: any[]): T }) => IEntityStore<T> | undefined;
}
