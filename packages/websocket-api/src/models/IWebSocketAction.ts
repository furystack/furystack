import { Disposable } from "@sensenet/client-utils";
import { Data } from "ws";

export interface IWebSocketActionStatic {
  canExecute(data: Data): boolean;
}

export interface IWebSocketAction extends Disposable {
  new: (...args: any[]) => IWebSocketActionStatic;
  authenticate: boolean;
  authorize: string[];
  execute(data: Data): void;
}
