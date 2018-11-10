import { Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { IService } from ".";
import { makeCollectionActivateable, makeCollectionDisposable, makeServiceCollection, setParentInjector } from "./CollectionExtensions";
import { LoggerCollection } from "./Loggers/LoggerCollection";
import { LogScopes } from "./Loggers/LogScopes";
import { IActivateable, IFuryStackOptions } from "./Models";
import { IApi } from "./Models/IApi";

export const defaultFuryStackOptions: IFuryStackOptions = {
    apis: [],
    services: [],
    loggers: [],
    injector: new Injector(),
};

export class FuryStack {
    public logger: LoggerCollection = new LoggerCollection();
    public readonly options: IFuryStackOptions;
    public async dispose() {
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Disposing ${this.constructor.name}.`,
        });
        this.apis.dispose();
        await this.services.stop();
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Disposing ${this.constructor.name} finished.`,
        });
    }
    public readonly apis: IApi[] & IActivateable & IDisposable;
    public readonly services: IService[] & IService;
    public async start() {
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Starting ${this.constructor.name}.`,
        });
        await this.apis.activate();
        await this.services.start();
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Starting ${this.constructor.name} finished.`,
        });
    }

    private attachLoggers(...args: Array<Iterable<{ loggers: LoggerCollection }>>) {
        for (const collection of args) {
            for (const item of collection) {
                try {
                    item.loggers.attachLogger(this.logger);
                } catch (error) {
                    this.logger.Error({
                        scope: LogScopes.FuryStack,
                        message: `Error attaching logger for item '${item.constructor.name}'`,
                        data: {error},
                    });
                }
            }
        }
    }

    constructor(options?: Partial<IFuryStackOptions>) {
        this.options = { ...defaultFuryStackOptions, ...options };
        this.attachLoggers(this.options.apis, this.options.services);

        this.logger.attachLogger(...this.options.loggers);
        this.apis = setParentInjector(makeCollectionDisposable(makeCollectionActivateable(Array.from(this.options.apis))), this.options.injector);
        this.services = makeServiceCollection(Array.from(this.options.services));

    }
}
