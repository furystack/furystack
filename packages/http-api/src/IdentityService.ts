import { InMemoryStore, IPhysicalStore, IUser, LoggerCollection, visitorUser } from "@furystack/core";
import { Constructable, Injector } from "@furystack/inject";
import { sha256 } from "hash.js";
import { IncomingMessage, ServerResponse } from "http";
import { v1 } from "uuid";
import { IExternalLoginService } from "./Models";
export type ILoginUser<T extends IUser> = T & { Password: string };

export interface IIdentityServiceOptions<TUser extends IUser> {
    users: IPhysicalStore<ILoginUser<TUser>>;
    sessions: IPhysicalStore<{SessionId: string, Username: string}>;
    cookieName: string;
    hashMethod: (plain: string) => string;
    injector: Injector;
}

export class IdentityService<TUser extends IUser = IUser> {

    public static LogScope = "@furystack/http-api/IdentityService";
    public async authenticateUser(userName: string, password: string): Promise<TUser> {
        const match = await this.options.users.filter({
            Username: userName,
            Password: this.options.hashMethod(password),
        } as Partial<ILoginUser<TUser>>);
        if (match.length === 1) {
            return match[0];
        }
        return visitorUser as TUser;
    }

    private getSessionIdFromRequest(req: IncomingMessage): string | null {
        if (req.headers.cookie) {
            /** */
            const cookies = req.headers.cookie.toString().split(";")
                .map((val) => {
                    const [name, value] = val.split("=");
                    return { name: name.trim(), value: value.trim() };
                });
            const sessionCookie = cookies.find((c) => c.name === this.options.cookieName);
            if (sessionCookie) {
                return sessionCookie.value;
            }
        }
        return null;
    }

    public async authenticateRequest(req: IncomingMessage): Promise<TUser> {
        // Basic auth
        if (req.headers.authorization) {
            const authData = Buffer.from(req.headers.authorization.toString().split(" ")[1], "base64");
            const [userName, password] = authData.toString().split(":");
            return await this.authenticateUser(userName, password);
        }

        // Cookie auth
        const sessionId = this.getSessionIdFromRequest(req);
        if (sessionId) {
            const session = await this.options.sessions.get(sessionId);
            return (session && await this.options.users.get(session.Username as any)) || visitorUser as TUser;
        }

        return visitorUser as TUser;
    }

    public async cookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<TUser> {
        const user = await this.authenticateUser(username, password);
        if (user !== visitorUser) {
            const sessionId = v1();
            await this.options.sessions.update(sessionId, {SessionId: sessionId, Username: user.Username});
            serverResponse.setHeader("Set-Cookie", `${this.options.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`);
            this.options.injector.GetInstance(LoggerCollection).Information({
                scope: IdentityService.LogScope,
                message: `User '${user.Username}' logged in.`,
                data: {
                    user,
                    sessionId,
                },
            });
        }
        return user;
    }

    public async externalLogin<T extends IExternalLoginService<TUser, TArgs>, TArgs extends any[]>(service: Constructable<T>, serverResponse: ServerResponse, ...args: TArgs): Promise<TUser> {
        try {
            const instance = this.options.injector.GetInstance(service);
            const user = await instance.login(this, ...args);
            if (user.Username !== visitorUser.Username) {
                const sessionId = v1();
                await this.options.sessions.update(sessionId, {SessionId: sessionId, Username: user.Username});
                serverResponse.setHeader("Set-Cookie", `${this.options.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`);
                this.options.injector.GetInstance(LoggerCollection).Information({
                    scope: IdentityService.LogScope,
                    message: `User '${user.Username}' logged in with '${service.name}' external service.`,
                    data: {
                        user,
                        sessionId,
                    },
                });
                return user;
            }
        } catch (error) {
            /** */
            this.options.injector.GetInstance(LoggerCollection).Error({
                scope: IdentityService.LogScope,
                message: `Error during external login with '${service.name}': ${error.message}`,
                data: { error },
            });
        }
        return visitorUser as TUser;
    }

    public async cookieLogout(req: IncomingMessage, serverResponse: ServerResponse) {
        const sessionId = this.getSessionIdFromRequest(req);
        if (sessionId) {
            const user = await this.authenticateRequest(req);
            await this.options.sessions.remove(sessionId);
            serverResponse.setHeader("Set-Cookie", `${this.options.cookieName}=; Path=/; Secure; HttpOnly`);
            this.options.injector.GetInstance(LoggerCollection).Information({
                scope: IdentityService.LogScope,
                message: `User '${user.Username}' has been logged out.`,
                data: {
                    user,
                    sessionId,
                },
            });
        }
    }

    public readonly options: IIdentityServiceOptions<TUser> = {
        users: new InMemoryStore<ILoginUser<TUser>>("Username"),
        sessions: new InMemoryStore<{SessionId: string, Username: string}>("SessionId"),
        cookieName: "fss",
        hashMethod: (plain) => sha256().update(plain).digest("hex"),
        injector: Injector.Default,
    };

    constructor(options?: Partial<IdentityService<TUser>["options"]>) {
        this.options = { ...this.options, ...options };
    }
}
