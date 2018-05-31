import { IDisposable } from "@sensenet/client-utils";
import { Server } from "tls";
import { LoggerCollection } from "./Loggers/LoggerCollection";
import { LogScopes } from "./Loggers/LogScopes";
import { IApi } from "./Models/IApi";
import { IContext } from "./Models/IContext";
import { ILogger } from "./Models/ILogger";

export class StackBuilder {
    private logger: LoggerCollection = new LoggerCollection();
    public dispose() {
        this.logger.trace(LogScopes.StackBuilder, "Starting to dispose StackBuilder.");
        for (const api of this.apis) {
            api.dispose();
        }
        this.server.close();
        this.logger.trace(LogScopes.StackBuilder, "Disposing StackBuilder finished.");
    }

    public attachLogger = (logger: ILogger) => this.logger.attachLogger(logger);

    protected apis: Array<IApi<IContext>> = [];
    public getApis() {
        return [...this.apis];
    }
    public addApi(api: IApi<IContext>) {
        return this;
    }

    constructor(protected server: Server) { }
}
