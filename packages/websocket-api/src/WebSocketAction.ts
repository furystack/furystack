import { Injector } from "@furystack/inject";
import { Data } from "ws";
import { IWebSocketAction, IWebSocketContext } from "./models";
export abstract class WebSocketAction implements IWebSocketAction {
    public readonly authenticate = false;
    public readonly authorize = [];
    public abstract canExecute(data: Data): boolean;
    public abstract execute(data: Data, context: IWebSocketContext, injector: Injector): any;
}
