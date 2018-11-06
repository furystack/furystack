import { IdentityService } from "@furystack/http-api";
import { Injector } from "@furystack/inject";
import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { IWebSocketAction } from "./IWebSocketAction";

export interface IWebSocketApiConfiguration {
    server: HttpServer | HttpsServer;
    identityService: IdentityService;
    logScope: string;
    actions: IWebSocketAction[];
    path: string;
    injector: Injector;
}
