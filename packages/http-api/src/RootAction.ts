import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { AllowCors } from "./ActionDecorators/AllowCors";
import { MetadataAction } from "./MetadataAction";
import { IRequestAction } from "./Models";
import { NotFoundAction } from "./NotFoundAction";
import { RequestAction } from "./RequestAction";
import { RequestContext } from "./RequestContext";

export interface IRootActionOptions {
    notFound: RequestAction;
    default: RequestAction;
    children: RequestAction[];
}

export const defaultRootActionOptions: IRootActionOptions = {
    notFound: new NotFoundAction(),
    default: new MetadataAction(),
    children: [],
};

export class RootAction extends RequestAction {
    public segmentName: string = "";
    public async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => RequestContext) {
        if (incomingMessage.url && incomingMessage.url.split("/").join("")) {
            return await this.options.notFound.exec(incomingMessage, serverResponse, getContext);
        } else {
            return await this.options.default.exec(incomingMessage, serverResponse, getContext);
        }
    }

    private readonly options: IRootActionOptions;

    constructor(options?: Partial<IRootActionOptions>) {
        super(...Array.from<RequestAction>(new Set<RequestAction>([...options && options.children || [], ...defaultRootActionOptions.children])));
        this.options = { ...defaultRootActionOptions, ...options };
    }
}
