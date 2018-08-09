import { IApi, LoggerCollection } from "@furystack/core";
import { Injector } from "@furystack/inject";
import { IncomingMessage } from "http";
import { parse } from "url";
import { Server as WebSocketServer } from "ws";
import { WebSocketContext } from ".";
import { IdentityService } from "../node_modules/@furystack/http-api";
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
    public contextFactory = (identityService: IdentityService, incomingMessage: IncomingMessage, injector?: Injector) => new WebSocketContext(identityService, incomingMessage, injector);
    public activate: () => Promise<void> = async () => { /** */ };
    public dispose: () => void = async () => { /** */ };
    private readonly options: IWebSocketApiConfiguration;
    private readonly socket: WebSocketServer;
    private readonly resolver: ActionResolver;
    constructor(options: Partial<IWebSocketApiConfiguration> & { server: IWebSocketApiConfiguration["server"], identityService: IWebSocketApiConfiguration["identityService"] }) {
        this.options = { ...defaultOptions, ...options };
        this.socket = new WebSocketServer({ noServer: true });
        this.resolver = new ActionResolver(this.options.actions);
        this.socket.on("connection", async (ws, msg) => {
            this.loggers.trace("Connected to WebSocket");
            const context = this.contextFactory(this.options.identityService, msg);
            ws.on("message", (message) => {
                this.resolver.execute(message, context, this.injector, (data) => {
                    return new Promise((success, reject) => {
                        ws.send(data, (error) => {
                            error ? reject(error) : success();
                        });
                    });
                });
            });

            ws.on("close", () => {
                this.loggers.trace("Disconnected");
            });
        });

        this.options.server.on("upgrade", (req, socket, head) => {
            const pathname = parse(req.url).pathname;
            if (pathname === this.options.path) {
                this.socket.handleUpgrade(req, socket, head, (ws) => {
                    ws.emit("connection", ws, req);
                });
            }
        });
    }
}
