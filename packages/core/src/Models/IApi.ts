import { IDisposable } from "@sensenet/client-utils";
import { IContext } from "./IContext";

export interface IApi<TContext extends IContext> extends IDisposable {
    ContextFactory: (...args: any[]) => TContext;
    Start();
}
