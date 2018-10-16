import { IApi, InMemoryStore, IUser, LoggerCollection } from "@furystack/core";
import { Injector } from "@furystack/inject";
import { IncomingMessage, ServerResponse } from "http";
import { Server as HttpServer } from "http";
import { Server } from "net";
import { parse } from "url";
import { ErrorAction, IdentityService, ILoginUser, RequestAction, RequestContext } from "./";
import { MetadataAction } from "./MetadataAction";
import { NotFoundAction } from "./NotFoundAction";
import { RootAction } from "./RootAction";

export interface IHttpApiConfiguration {
    serverFactory: (requestListener: (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => void) => Server;
    hostName: string;
    port: number;
    protocol: "http" | "https";
    identityService: IdentityService;
    rootActions: RequestAction[];
    defaultAction: RequestAction;
    notFoundAction: RequestAction;
    errorAction: RequestAction & { returnError(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => RequestContext, error: any): Promise<void> };
    logScope: string;
}

export const defaultHttpApiConfiguration: IHttpApiConfiguration = {
    defaultAction: new MetadataAction(),
    errorAction: new ErrorAction(),
    hostName: "localhost",
    identityService: new IdentityService(),
    serverFactory: (listener) => new HttpServer(listener),
    notFoundAction: new NotFoundAction(),
    rootActions: [],
    port: 8080,
    protocol: "http",
    logScope: "HTTP_API",
};

export class HttpApi implements IApi<RequestContext> {
    public injector = new Injector();
    public loggers: LoggerCollection = new LoggerCollection();
    public contextFactory(incomingMessage: IncomingMessage, serverResponse: ServerResponse, identityService: IdentityService<ILoginUser<IUser>>) {
        return new RequestContext(incomingMessage, serverResponse, identityService);
    }

    private readonly rootAction: RequestAction;

    public async mainRequestListener(incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
        let context!: RequestContext;
        const contextFactoryCached = () => {
            if (!context) {
                context = this.contextFactory(incomingMessage, serverResponse, this.options.identityService);
            }
            return context;
        };

        const url = parse(`${this.options.port}://${this.options.hostName}:${this.options.port}${incomingMessage.url}`, true);
        const pathSegments = (url.pathname as string).split("/").filter((s) => s.length);
        const action = this.rootAction.resolve(pathSegments, incomingMessage, serverResponse);
        try {
            await action.exec(incomingMessage, serverResponse, contextFactoryCached);
            this.loggers.trace(this.options.logScope, `Returned ${serverResponse.statusCode} from '${incomingMessage.url}'`);
        } catch (error) {
            this.loggers.error(this.options.logScope, error);
            this.options.errorAction.returnError(incomingMessage, serverResponse, contextFactoryCached, error);
        }
    }

    public async activate() {
        this.server.listen(this.options.port, this.options.hostName, 8192);
    }
    public dispose() {
        this.server.close();
    }

    private readonly options: IHttpApiConfiguration;
    public readonly server: Server;

    constructor(options?: Partial<IHttpApiConfiguration>) {
        this.options = { ...defaultHttpApiConfiguration, ...options };
        this.rootAction = new RootAction({
            children: this.options.rootActions,
            notFound: this.options.notFoundAction,
            default: this.options.defaultAction,
        });
        this.server = this.options.serverFactory(this.mainRequestListener.bind(this));
    }
}
