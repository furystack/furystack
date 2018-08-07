import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { Authorize } from "../ActionDecorators/Authorize";
import { Method } from "../ActionDecorators/Method";
import { IdentityClaims } from "../Claims";
import { IdentityService } from "../IdentityService";
import { RequestAction } from "../RequestAction";
import { Utils } from "../Utils";

@Method("POST")
@Authorize(IdentityClaims.IsVisitor)
export class LoginAction extends RequestAction {

    public async exec(incomingMessage: IncomingMessage, response: ServerResponse, _getContext: () => IContext) {
        const loginData = await Utils.readPostBody<{ username: string, password: string }>(incomingMessage);
        const user = await this.identityService.cookieLogin(loginData.username, loginData.password, response);
        response.writeHead(200, {
            "Content-Type": "application/json",
        });
        response.write(JSON.stringify(user));
        response.end();
    }
    public segmentName: string = "login";

    /**
     *
     */
    constructor(private readonly identityService: IdentityService, ...childActions: RequestAction[]) {
        super(...childActions);

    }
}
