import { IncomingMessage, ServerResponse } from "http";
import { Method } from "../ActionDecorators/Method";
import { IdentityService } from "../IdentityService";
import { RequestAction } from "../RequestAction";

@Method("POST")
export class LogoutAction extends RequestAction {

    public async exec(_incomingMessage: IncomingMessage, _response: ServerResponse) {
        await this.identityService.cookieLogout(_incomingMessage, _response);
        _response.writeHead(200);
        _response.end(JSON.stringify({ success: true }));
    }
    public segmentName: string = "logout";

    /**
     *
     */
    constructor(private readonly identityService: IdentityService) {
        super();
    }
}
