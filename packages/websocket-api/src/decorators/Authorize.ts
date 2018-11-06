import { Constructable, IRole, LoggerCollection } from "@furystack/core";
import { Data } from "ws";
import { IWebSocketAction } from "../models/IWebSocketAction";
import { IWebSocketContext } from "../models/IWebSocketContext";

export const Authorize = (...roles: IRole[]) =>
    <T extends Constructable<IWebSocketAction>>(constructor: T) => {
        return class extends constructor {

            public readonly authenticate: boolean = true;

            public async execute(data: Data, context: IWebSocketContext  ): Promise<void> {
                const authorized = await context.isAuthorized(...roles);
                if (!authorized) {
                    const user = await context.getCurrentUser();
                    context.send(`Error: Action needs authorization.`);
                    context.getInjector().GetInstance(LoggerCollection).Warning({
                        scope: "@furystack/websocket-api/@Authenticate()",
                        message: `User '${user.Username}' has been tried to access to execute websocket action '${constructor.name}' without the required roles.`,
                        data: {
                            action: constructor.name,
                            user,
                            roles,
                        },
                    });
                    return;
                }
                return await super.execute(data, context);
            }
        };
    };
