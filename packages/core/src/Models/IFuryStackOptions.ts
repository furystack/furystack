import { IApi } from "./IApi";
import { IContext } from "./IContext";
import { ILogger } from "./ILogger";
import { IService } from "./IService";

export interface IFuryStackOptions {
    apis: Iterable<IApi<IContext>>;
    services: Iterable<IService>;
    loggers: ILogger[];
}
