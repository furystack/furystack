import { Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { LoggerCollection } from "../Loggers/LoggerCollection";
import { IActivateable } from "./IActivateable";
import { IContext } from "./IContext";

export interface IApi<TContext extends IContext> extends IActivateable, IDisposable {
    loggers: LoggerCollection;
    injector: Injector;
    contextFactory: (...args: any[]) => TContext;
}
