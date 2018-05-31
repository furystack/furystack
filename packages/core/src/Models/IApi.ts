import { IActivateable } from "./IActivateable";
import { IContext } from "./IContext";

export interface IApi<TContext extends IContext> extends IActivateable {
    contextFactory: (...args: any[]) => TContext;
}
