import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { Authorize } from "./ActionDecorators/Authorize";
import { RequestAction } from "./RequestAction";

export class NotFoundAction extends RequestAction {
    public async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, _getContext: () => IContext): Promise<void> {
        serverResponse.writeHead(404, "NOT FOUND :(");
        serverResponse.write(JSON.stringify({ Error: "Content not found", url: incomingMessage.url }));
        serverResponse.end();
    }
    public segmentName: string = "";

    constructor() {
        super();
    }
}
