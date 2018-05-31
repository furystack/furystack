import { IDisposable } from "@sensenet/client-utils";
import { Server } from "tls";
import { makeCollectionActivateable, makeCollectionDisposable } from "./CollectionExtensions";
import { LoggerCollection } from "./Loggers/LoggerCollection";
import { LogScopes } from "./Loggers/LogScopes";
import { IApi } from "./Models/IApi";
import { IContext } from "./Models/IContext";
import { ILogger } from "./Models/ILogger";

export class StackBuilder {
    private logger: LoggerCollection = new LoggerCollection();
    public dispose() {
        this.logger.trace(LogScopes.StackBuilder, "Starting to dispose StackBuilder.");
        this.apis.dispose();
        this.server.close();
        this.logger.trace(LogScopes.StackBuilder, "Disposing StackBuilder finished.");
    }

    public attachLogger = (logger: ILogger) => this.logger.attachLogger(logger);

    protected apis = makeCollectionDisposable(makeCollectionActivateable([] as Array<IApi<IContext>>));
    public getApis = () => [...this.apis];
    public addApi(api: (builder: this) => IApi<IContext>): this {
        this.apis.push(api(this));
        return this;
    }

    public getServer = () => this.server;

    public async start() {
        await this.apis.activate();
    }

    constructor(protected readonly server: Server) { }
}
