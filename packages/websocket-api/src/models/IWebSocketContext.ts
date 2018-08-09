import { IContext } from "@furystack/core";
import { Data } from "ws";
// tslint:disable-next-line:no-empty-interface
export interface IWebSocketContext extends IContext {
    send(data: Data): Promise<void>;
}
