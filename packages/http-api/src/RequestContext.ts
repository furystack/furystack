import { IContext, IEntityStore, IUser, visitorUser } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { IdentityService, ILoginUser } from "./IdentityService";

export class RequestContext implements IContext {

    public getEntityStore: <T>(type: new (...args: any[]) => T) => IEntityStore<T> | undefined = () => undefined;
    public Entities: any;
    public async isAuthenticated(): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        return currentUser !== visitorUser;
    }
    public async isAuthorized(...claims: string[]): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        for (const claim of claims) {
            if (!currentUser.Claims.some((c) => c === claim)) {
                return false;
            }
        }
        return true;
    }

    private _currentUser?: IUser;
    public async getCurrentUser(): Promise<IUser> {
        if (this._currentUser) {
            return this._currentUser;
        }
        const currentUser = await this.identityService.authenticateRequest(this.incomingMessage);
        this._currentUser = currentUser;
        return currentUser;
    }
    constructor(
        public readonly incomingMessage: IncomingMessage,
        public readonly serverResponse: ServerResponse,
        public readonly identityService: IdentityService<ILoginUser<IUser>>,
    ) { }
}
