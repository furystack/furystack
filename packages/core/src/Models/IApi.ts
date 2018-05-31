import { IDisposable } from "@sensenet/client-utils";
import { IActivateable } from "./IActivateable";
import { IContext } from "./IContext";

export interface IApi<TContext extends IContext> extends IActivateable, IDisposable {
    contextFactory: (...args: any[]) => TContext;
}
