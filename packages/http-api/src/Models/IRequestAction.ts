import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";

export interface IRequestAction {
    methodType?: string;
    authenticate?: boolean;
    authorize?: string[];
    childActions: IRequestAction[];
    resolve(segments: string[], incomingMessage: IncomingMessage, serverResponse: ServerResponse): IRequestAction;
    exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void>;
    method: string;
    segmentName: string;
    parentAction?: IRequestAction;
}
