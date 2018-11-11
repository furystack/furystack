import { IApi, LoggerCollection } from "@furystack/core";
import { Constructable, Injectable, Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { IncomingMessage } from "http";
import { parse } from "url";
import { Data, Server as WebSocketServer } from "ws";
import * as ws from "ws";
import { IWebSocketAction, IWebSocketActionStatic } from "./models";
import { WebSocketApiConfiguration } from "./WebSocketApiConfiguration";

@Injectable()
export class WebSocketApi implements IApi {
    public async activate() {
        /** */
    }
    public async dispose() {
        /** */
    }
    private readonly socket: WebSocketServer;
    private readonly injector: Injector;
    private readonly logScope: string = "@furystack/websocket-api" + this.constructor.name;

    public Actions: Array<Constructable<IWebSocketAction> & IWebSocketActionStatic> = [];
    public Path: string = "/socket";

    constructor(private readonly logger: LoggerCollection, private readonly options: WebSocketApiConfiguration, parentInjector: Injector) {
        this.socket = new WebSocketServer({ noServer: true });
        this.injector = new Injector({ parent: parentInjector });
        this.socket.on("connection", (websocket, msg) => {
            this.logger.Verbose({
                scope: this.logScope,
                message: "Client connected to WebSocket",
                data: {
                    address: msg.connection.address,
                },
            });
            websocket.on("message", (message) => {
                this.logger.Verbose({
                    scope: this.logScope,
                    message: "Client Message received",
                    data: {
                        message: message.toString(),
                        address: msg.connection.address,
                    },
                });
                this.execute(message, msg, websocket);
            });

            websocket.on("close", () => {
                this.logger.Verbose({
                    scope: this.logScope,
                    message: "Client disconnected",
                    data: {
                        address: msg.connection.address,
                    },
                });
            });
        });

        this.options.Server.on("upgrade", (request, socket, head) => {
            const pathname = parse(request.url).pathname;
            if (pathname === this.Path) {
                this.socket.handleUpgrade(request, socket, head, (websocket) => {
                    this.logger.Verbose({
                        scope: this.logScope,
                        message: `Client connected to socket at '${this.Path}'.`,
                        data: {
                            path: this.Path,
                        },
                    });
                    this.socket.emit("connection", websocket, request);
                });
            }
        });
    }

    public execute(data: Data, msg: IncomingMessage, websocket: ws) {
        const action = this.Actions.find((a) => a.canExecute(data));
        if (action) {
            usingAsync(new Injector({ parent: this.injector }), async (i) => {
                i.SetInstance(i);
                i.SetInstance(msg);
                i.SetInstance(websocket);
                const actionInstance = i.GetInstance<IWebSocketAction>(action);
                actionInstance.execute(data);
            });
        }
    }
}
