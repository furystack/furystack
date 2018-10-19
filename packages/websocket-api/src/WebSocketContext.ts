import { IRole, IUser, visitorUser } from "@furystack/core";
import { IdentityService } from "@furystack/http-api";
import { Injector } from "@furystack/inject";
import { IncomingMessage } from "http";
import { Data } from "ws";
import * as Ws from "ws";
import { IWebSocketContext } from "./models/IWebSocketContext";

export class WebSocketContext implements IWebSocketContext {

    public send(data: Data) {
        return new Promise<void>((success, reject) => {
            this.ws.send(data, (error) => {
                error ? reject(error) : success();
            });
        });
    }

    public async isAuthenticated(): Promise<boolean> {
        const currentUser = await this.identityService.authenticateRequest(this.incomingMessage);
        return currentUser !== visitorUser;
    }

    public async isAuthorized(...roles: IRole[]): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        for (const role of roles) {
            if (!currentUser.Roles.some((c) => c.Id === role.Id)) {
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

    public getInjector = () => this.injector;

    constructor(private readonly identityService: IdentityService, private readonly incomingMessage: IncomingMessage, private ws: Ws, private readonly injector = new Injector()) {

    }

}
