import { Constructable, Injector } from "@furystack/inject";
import { IApi } from "./IApi";
import { ILogger } from "./ILogger";

export interface IFuryStackOptions {
    apis: Iterable<Constructable<IApi>>;
    loggers: ILogger[];
    injector: Injector;
}
