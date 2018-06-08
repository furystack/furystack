import { IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { IRequestAction } from "./Models/IRequestAction";

export abstract class RequestAction implements IRequestAction {
    public childActions: IRequestAction[] = [];

    public readonly authenticate = false;
    public readonly authorize = [];
    public readonly methodType = "";

    public resolve(segments: string[], incomingMessage: IncomingMessage, serverResponse: ServerResponse): IRequestAction {
        const childAction = this.childActions.find((action) => (action.segmentName === segments[0]));
        if (childAction) {
            const childSegments = [...segments];
            childSegments.splice(0, 1);
            return childAction.resolve(childSegments, incomingMessage, serverResponse);
        }
        return this;
    }
    public abstract async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void>;
    public method: string = "GET";
    public abstract segmentName: string;
    public parentAction?: IRequestAction;

    public toJSON() {
        return {
            segmentName: this.segmentName,
            childActions: this.childActions,
            authenticate: this.authenticate || false,
            authorize: this.authorize,
            methodType: this.methodType,
        };
    }

    constructor(...childActions: IRequestAction[]) {
        childActions.forEach((c) => c.parentAction = this);
        this.childActions = childActions;
    }
}
