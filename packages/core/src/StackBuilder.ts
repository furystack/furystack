import { IDisposable } from "@sensenet/client-utils";
import { Server } from "tls";
import { BypassLogger } from "./Loggers";
import { IApi } from "./Models/IApi";
import { IContext } from "./Models/IContext";
import { ILogger } from "./Models/ILogger";

export class StackBuilder {
    public logger: ILogger = new BypassLogger();
    public dispose() {
        this.logger.trace("Starting to dispose StackBuilder.");
        for (const api of this.apis) {
            api.dispose();
        }
        this.server.close();
        this.logger.trace("Disposing StackBuilder finished.");
    }
    protected apis: Array<IApi<IContext>> = [];
    public addApi(api: IApi<IContext>) {
        return this;
    }

    constructor(protected server: Server) { }
}
