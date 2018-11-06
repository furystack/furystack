import { Injector } from "@furystack/inject";
import { Data } from "ws";
import { IWebSocketContext } from "./IWebSocketContext";

export interface IWebSocketAction {
    authenticate: boolean;
    authorize: string[];
    canExecute(data: Data): boolean;
    execute(data: Data, context: IWebSocketContext): void;
}
