import { Constructable, LoggerCollection } from "@furystack/core";
import { Data } from "ws";
import { IWebSocketAction } from "../models/IWebSocketAction";
import { IWebSocketContext } from "../models/IWebSocketContext";

export const Authenticate = () =>
    <T extends Constructable<IWebSocketAction>>(constructor: T) => {
        return class extends constructor {

            public readonly authenticate: boolean = true;

            public async execute(data: Data, context: IWebSocketContext  ): Promise<void> {
                const authenticated = await context.isAuthenticated();
                if (!authenticated) {
                    context.send(`Error: Action needs authentication.`);
                    context.getInjector().GetInstance(LoggerCollection).Warning({
                        scope: "@furystack/websocket-api/@Authenticate()",
                        message: `A Visitor user has been tried to execute action '${constructor.name}' without authentication.`,
                        data: {
                            action: constructor.name,
                        },
                    });
                    return;
                }
                return await super.execute(data, context);
            }
        };
    };
