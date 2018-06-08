import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { Authorize } from "./ActionDecorators/Authorize";
import { RequestAction } from "./RequestAction";

export class ErrorAction extends RequestAction {
    public exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public async returnError(incomingMessage: IncomingMessage, serverResponse: ServerResponse, _getContext: () => IContext, error: any): Promise<void> {
        serverResponse.writeHead(500, "Server error",
            { "Content-Type": "application/json" },
        );
        serverResponse.write(JSON.stringify({ message: error.message, url: incomingMessage.url, stack: error.stack }));
        serverResponse.end();
    }
    public segmentName: string = "";

    constructor() {
        super();
    }
}
