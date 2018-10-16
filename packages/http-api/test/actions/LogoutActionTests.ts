import { expect } from "chai";
import { LogoutAction } from "../../src/Actions/Logout";
import { IdentityService } from "../../src/IdentityService";

export const logoutActionTests = describe("LogoutAction", () => {
    it("should be constructed without parameters", () => {
        const c = new LogoutAction(new IdentityService());
        expect(c).to.be.instanceof(LogoutAction);
    });

    it("exec", async () => {
        const c = new LogoutAction({
            cookieLogout: async () => undefined,
        } as any);
        await c.exec({
            method: "POST",
            headers: {
                cookie: "",
            },
        } as any, {
            writeHead: () => undefined,
            end: () => undefined,
        } as any);
    });
});
