import { Data } from "ws";
import { WebSocketContext } from "../WebSocketContext";

export interface IWebSocketAction {
    authenticate: boolean;
    authorize: string[];
    canExecute: (data: Data) => boolean;
    execute: (data: Data, context: WebSocketContext, send: (data: any) => Promise<void>) => void;
}
