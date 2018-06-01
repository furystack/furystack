import { Constructable, IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { IRequestAction } from "../Models/IRequestAction";
export const Method = (methodType: "GET" | "POST") => {
    return <T extends Constructable<IRequestAction>>(ctor: T) => class extends ctor {
        public readonly methodType: string = methodType;

        public async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void> {
            if (incomingMessage.method !== this.methodType) {
                serverResponse.writeHead(405, "Method Not Allowed");
                serverResponse.end();
                return;
            }
            return await super.exec(incomingMessage, serverResponse, getContext);
        }
    };
};
