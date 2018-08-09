import { Data } from "ws";
export abstract class WebSocketAction {
    public readonly authenticate = false;
    public readonly authorize = [];
    public abstract canExecute(data: Data): boolean;
    public abstract execute(data: Data): any;
}
