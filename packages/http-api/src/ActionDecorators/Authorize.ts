import { Constructable, IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { IRequestAction } from "../Models/IRequestAction";

export const Authorize = (...claims: string[]) =>
    <T extends Constructable<IRequestAction>>(constructor: T) => {
    return class extends constructor {
        public readonly authorize: string[] = claims;
        public async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void> {
            const authorized = await getContext().isAuthorized(...claims);
            if (!authorized) {
                serverResponse.writeHead(403, "Forbidden");
                serverResponse.end();
                return;
            }
            return await super.exec(incomingMessage, serverResponse, getContext);
        }
    };
};
