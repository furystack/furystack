import { IncomingMessage, ServerResponse } from "http";
import { RequestAction } from "./RequestAction";

export class RouteAction extends RequestAction {

    public async exec(incomingMessage: IncomingMessage, response: ServerResponse) {
        response.writeHead(200);
        response.write(JSON.stringify({
            url: incomingMessage.url,
            actions: this.childActions.map((a) => a.segmentName),
        }));
        response.end();
    }

    /**
     *
     */
    constructor(public segmentName: string, ...childActions: RequestAction[]) {
        super(...childActions);
    }
}
