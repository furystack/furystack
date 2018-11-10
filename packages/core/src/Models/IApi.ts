import { Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { LoggerCollection } from "../Loggers/LoggerCollection";
import { IActivateable } from "./IActivateable";

export interface IApi extends IActivateable, IDisposable {
    loggers: LoggerCollection;
    injector: Injector;
}
