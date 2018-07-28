import { IDisposable } from "@sensenet/client-utils";
import { IService } from ".";
import { makeCollectionActivateable, makeCollectionDisposable, makeServiceCollection } from "./CollectionExtensions";
import { LoggerCollection } from "./Loggers/LoggerCollection";
import { LogScopes } from "./Loggers/LogScopes";
import { IActivateable, IFuryStackOptions } from "./Models";
import { IApi } from "./Models/IApi";
import { IContext } from "./Models/IContext";

export const defaultFuryStackOptions: IFuryStackOptions = {
    apis: [],
    services: [],
    loggers: [],
};

export class FuryStack {
    public logger: LoggerCollection = new LoggerCollection();
    public readonly options: IFuryStackOptions;
    public async dispose() {
        this.logger.trace(LogScopes.FuryStack, `Disposing ${this.constructor.name}.`);
        this.apis.dispose();
        await this.services.stop();
        this.logger.trace(LogScopes.FuryStack, `Disposing ${this.constructor.name} finished.`);
    }
    public readonly apis: Array<IApi<IContext>> & IActivateable & IDisposable;
    public readonly services: IService[] & IService;
    public async start() {
        this.logger.trace(LogScopes.FuryStack, `Starting ${this.constructor.name}.`);
        await this.apis.activate();
        await this.services.start();
        this.logger.trace(LogScopes.FuryStack, `Starting ${this.constructor.name} finished.`);
    }

    private attachLoggers(...args: Array<Iterable<{ loggers: LoggerCollection }>>) {
        for (const collection of args) {
            for (const item of collection) {
                try {
                    item.loggers.attachLogger(this.logger);
                } catch (error) {
                    this.logger.error(LogScopes.FuryStack, `Error attaching logger for item '${item.constructor.name}'`, error);
                }
            }
        }
    }

    constructor(options?: Partial<IFuryStackOptions>) {
        this.options = { ...defaultFuryStackOptions, ...options };
        this.attachLoggers(this.options.apis, this.options.services);

        this.logger.attachLogger(...this.options.loggers);
        this.apis = makeCollectionDisposable(makeCollectionActivateable(Array.from(this.options.apis)));
        this.services = makeServiceCollection(Array.from(this.options.services));
    }
}
