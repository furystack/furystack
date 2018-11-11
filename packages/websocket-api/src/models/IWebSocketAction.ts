import { Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { Data } from "ws";

export interface IWebSocketActionStatic {
    canExecute(data: Data): boolean;
}

export interface IWebSocketAction extends IDisposable {
    new: (...args: any[]) => IWebSocketActionStatic;
    authenticate: boolean;
    authorize: string[];
    execute(data: Data): void;
}
