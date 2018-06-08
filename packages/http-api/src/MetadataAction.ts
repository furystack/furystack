import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { Authorize } from "./ActionDecorators/Authorize";
import { IRequestAction } from "./Models/IRequestAction";
import { RequestAction } from "./RequestAction";

export class MetadataAction extends RequestAction {
    public async exec(_incomingMessage: IncomingMessage, serverResponse: ServerResponse, _getContext: () => IContext): Promise<void> {
        let root: IRequestAction = this;
        while (this.parentAction && root !== this.parentAction) {
            root = this.parentAction;
        }
        serverResponse.writeHead(200, { "Content-Type": "application/json" });
        serverResponse.end(JSON.stringify(root));
    }
    public segmentName: string = "metadata";

    /**
     *
     */
    constructor(...childActions: IRequestAction[]) {
        super(...childActions);

    }
}
