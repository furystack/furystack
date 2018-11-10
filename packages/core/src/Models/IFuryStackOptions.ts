import { Constructable, Injector } from "@furystack/inject";
import { IApi } from "./IApi";

export interface IFuryStackOptions {
    apis: Iterable<Constructable<IApi>>;
    injectorParent: Injector;
}
