import { IPhysicalStore, IUser, visitorUser } from "@furystack/core";
import { IncomingMessage, ServerResponse } from "http";
import { v1 } from "uuid";

export type ILoginUser<T extends IUser> = T & { Password: string };

export class IdentityService<TUser extends ILoginUser<IUser> = ILoginUser<IUser>> {

    public readonly sessions: Map<string, number> = new Map();

    private hashPassword(password: string): string {
        return password;
    }

    public async authenticateUser(userName: string, password: string): Promise<TUser> {
        const match = await this.users.filter({
            Username: userName,
            Password: this.hashPassword(password),
        } as Partial<TUser>);
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
            const sessionCookie = cookies.find((c) => c.name === this.cookieName);
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
        if (sessionId && this.sessions.has(sessionId)) {
            const userId = this.sessions.get(sessionId);
            return await this.users.get(userId as any) || visitorUser as TUser;
        }

        return visitorUser as TUser;
    }

    public async cookieLogin(username: string, password: string, serverResponse: ServerResponse): Promise<TUser> {
        const user = await this.authenticateUser(username, password);
        if (user !== visitorUser) {
            const sessionId = v1();
            this.sessions.set(sessionId, user.Id);
            serverResponse.setHeader("Set-Cookie", `${this.cookieName}=${sessionId}; Path=/; Secure; HttpOnly`);
        }
        return user;
    }

    public async cookieLogout(req: IncomingMessage, serverResponse: ServerResponse) {
        const sessionId = this.getSessionIdFromRequest(req);
        if (sessionId) {
            this.sessions.delete(sessionId);
            serverResponse.setHeader("Set-Cookie", `${this.cookieName}=; HttpOnly`);
        }
    }

    constructor(public readonly users: IPhysicalStore<TUser>, private readonly cookieName: string = "SENTINEL_SESSION") { }

}
