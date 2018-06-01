import { Constructable, IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { IRequestAction } from "../Models/IRequestAction";

export interface ICorsOptions {
    inherits: boolean;
    origins: string[];
    methods?: Array<"POST" | "GET" | "PUT" | "DELETE">;
    headers?: string[];
    credentials?: boolean;
}

export const AllowCors = (options: ICorsOptions) =>
    <T extends Constructable<IRequestAction>>(constructor: T) => {
    return class extends constructor {

        public addCorsHeaders(incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
            if (
                incomingMessage.headers &&
                incomingMessage.headers.origin !== incomingMessage.headers.host
                && options.origins.some((origin) => origin === incomingMessage.headers.origin)) {
                serverResponse.setHeader("Access-Control-Allow-Origin", incomingMessage.headers.origin as string);
                serverResponse.setHeader("Access-Control-Allow-Credentials", "true");
            }
        }

        public async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void> {
            this.addCorsHeaders(incomingMessage, serverResponse);
            return await super.exec(incomingMessage, serverResponse, getContext);
        }

        public resolve(segments: string[], incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
            if (options.inherits) {
                this.addCorsHeaders(incomingMessage, serverResponse);
            }
            return super.resolve(segments, incomingMessage, serverResponse);
        }
    };
};
