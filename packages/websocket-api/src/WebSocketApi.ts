import { IApi, LoggerCollection } from "@furystack/core";
import { IdentityService } from "@furystack/http-api";
import { Injector } from "@furystack/inject";
import { IncomingMessage } from "http";
import { parse } from "url";
import { Server as WebSocketServer } from "ws";
import * as Ws from "ws";
import { WebSocketContext } from ".";
import { ActionResolver } from "./ActionResolver";
import { IWebSocketApiConfiguration, IWebSocketContext } from "./models";

export const defaultOptions: IWebSocketApiConfiguration = {
    server: undefined as any,
    identityService: undefined as any,
    logScope: "WEB_SOCKET_API",
    path: "/socket",
    actions: [],
};

export class WebSocketApi implements IApi<IWebSocketContext> {
    public loggers: LoggerCollection = new LoggerCollection();
    public injector: Injector = new Injector();
    public contextFactory = (identityService: IdentityService, incomingMessage: IncomingMessage, webSocket: Ws, injector?: Injector) => new WebSocketContext(identityService, incomingMessage, webSocket, injector);
    public activate: () => Promise<void> = async () => { /** */ };
    public dispose: () => void = async () => { /** */ };
    private readonly options: IWebSocketApiConfiguration;
    private readonly socket: WebSocketServer;
    private readonly resolver: ActionResolver;
    constructor(options: Partial<IWebSocketApiConfiguration> & { server: IWebSocketApiConfiguration["server"], identityService: IWebSocketApiConfiguration["identityService"] }) {
        this.options = { ...defaultOptions, ...options };
        this.socket = new WebSocketServer({ noServer: true });
        this.resolver = new ActionResolver(this.options.actions);
        this.socket.on("connection", (ws, msg) => {
            this.loggers.trace(this.options.logScope, "Client connected to WebSocket");
            const context = this.contextFactory(this.options.identityService, msg, ws, this.injector);
            ws.on("message", (message) => {
                this.loggers.trace(this.options.logScope, "Client Message received");
                this.resolver.execute(message, context, this.injector);
            });

            ws.on("close", () => {
                this.loggers.trace(this.options.logScope, "Client disconnected");
            });
        });

        this.options.server.on("upgrade", (request, socket, head) => {
            const pathname = parse(request.url).pathname;
            if (pathname === this.options.path) {
                this.socket.handleUpgrade(request, socket, head, (ws) => {
                    this.loggers.trace(this.options.logScope, `Client connected to socket at '${this.options.path}'.`);
                    this.socket.emit("connection", ws, request);
                });
            }
        });
    }
}
