import { Injectable } from "@furystack/inject";
import { IncomingMessage, ServerResponse } from "http";
import { IdentityService } from "../IdentityService";
import { IRequestAction } from "../Models";

@Injectable()
export class LogoutAction implements IRequestAction {
    public dispose() { /**  */}

    public async exec() {
        await this.identityService.cookieLogout(this.incomingMessage, this.serverResponse);
        this.serverResponse.writeHead(200);
        this.serverResponse.end(JSON.stringify({ success: true }));
    }
    constructor(private readonly identityService: IdentityService, private incomingMessage: IncomingMessage, private serverResponse: ServerResponse) {
    }
}
