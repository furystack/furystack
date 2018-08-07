import { IContext, visitorUser } from "@furystack/core";
import { expect } from "chai";
import { LoginAction } from "../../src/Actions/Login";
import { IdentityService } from "../../src/IdentityService";

export const loginActionTests = describe("LoginAction", () => {
    it("should be constructed without parameters", () => {
        const c = new LoginAction(new IdentityService({} as any));
        expect(c).to.be.instanceof(LoginAction);
    });

    it("exec", async () => {
        const c = new LoginAction({
            cookieLogin: async () => visitorUser,
        } as any);
        await c.exec({
            method: "POST",
            on: (_event: string, callback: () => void) => {
                callback();
            },
            read: () => '{"value": 1}',

        } as any, {
            writeHead: (no: number) => expect(no).to.be.eq(200),
            write: () => undefined,
            end: () => undefined,
        } as any, () => ({
            isAuthorized: async () => true,
        } as Partial<IContext> as any));
    });
});
