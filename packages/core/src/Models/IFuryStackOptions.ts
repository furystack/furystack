import { Injector } from "@furystack/inject";
import { IApi } from "./IApi";
import { ILogger } from "./ILogger";
import { IService } from "./IService";

export interface IFuryStackOptions {
    apis: Iterable<IApi>;
    services: Iterable<IService>;
    loggers: ILogger[];
    injector: Injector;
}
