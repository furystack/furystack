import { IEntityStore } from "./IEntityStore";
import { IUser } from "./IUser";

export interface IContext {
    GetCurrentUser(): Promise<IUser>;
    IsAuthenticated(): Promise<boolean>;
    IsAuthorized(...claims: string[]): Promise<boolean>;
    GetEntityStore: <T>(type: { new(...args: any[]): T }) => IEntityStore<T> | undefined;
}
