import { Injector } from "@furystack/inject";
import { Data } from "ws";
import { IWebSocketAction } from "./models/IWebSocketAction";
import { WebSocketContext } from "./WebSocketContext";

export class ActionResolver {
    public execute(data: Data, context: WebSocketContext, injector: Injector, send: (data: any) => Promise<void>) {
        const action = this.actions.find((a) => a.canExecute(data));
        action && action.execute(data, context, send);
    }

    constructor(public readonly actions: IWebSocketAction[]) {
    }
}
