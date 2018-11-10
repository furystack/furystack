import { Injector } from "@furystack/inject";
import { LoggerCollection } from "./Loggers/LoggerCollection";
import { LogScopes } from "./Loggers/LogScopes";
import { IFuryStackOptions } from "./Models";
import { IApi } from "./Models/IApi";

export const defaultFuryStackOptions: IFuryStackOptions = {
    apis: [],
    loggers: [],
    injector: new Injector(),
};

export class FuryStack {
    public logger: LoggerCollection;
    public readonly options: IFuryStackOptions;
    public async dispose() {
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Disposing ${this.constructor.name}.`,
        });
        await this.apis.map((api) => api.dispose());
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Disposing ${this.constructor.name} finished.`,
        });
    }
    public readonly apis: IApi[];
    public async start() {
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Starting ${this.constructor.name}.`,
        });
        await this.apis.map((api) => api.activate());
        this.logger.Debug({
            scope: LogScopes.FuryStack,
            message: `Starting ${this.constructor.name} finished.`,
        });
    }

    constructor(options?: Partial<IFuryStackOptions>) {
        this.options = { ...defaultFuryStackOptions, ...options };
        this.logger = this.options.injector.GetInstance(LoggerCollection);
        this.apis = Array.from(this.options.apis).map((api) => this.options.injector.GetInstance(api));
    }
}
