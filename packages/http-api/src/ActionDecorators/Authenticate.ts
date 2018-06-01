import { Constructable, IContext } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { IRequestAction } from "../Models/IRequestAction";

export const Authenticate = () =>
    <T extends Constructable<IRequestAction>>(constructor: T) => {
        return class extends constructor {

            public readonly authenticate: boolean = true;

            public async exec(incomingMessage: IncomingMessage, serverResponse: ServerResponse, getContext: () => IContext): Promise<void> {
                const authenticated = await getContext().isAuthenticated();
                if (!authenticated) {
                    serverResponse.writeHead(401, "Unauthorized", {
                        "WWW-Authenticate": "Basic",
                    });
                    serverResponse.end();
                    return;
                }
                return await super.exec(incomingMessage, serverResponse, getContext);
            }
        };
    };
