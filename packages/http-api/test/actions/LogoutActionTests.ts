import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { IncomingMessage, ServerResponse } from "http";
import { IdentityService } from "../../src";
import { LogoutAction } from "../../src/Actions/Logout";

export const logoutActionTests = describe("LogoutAction", () => {
    it("exec", (done) => {
        let cookieLogoutCalled: boolean = false;
        usingAsync(new Injector({ parent: undefined }), async (i) => {
            i.SetInstance({ cookieLogout: async () => { cookieLogoutCalled = true; } }, IdentityService);
            i.SetInstance({}, IncomingMessage);
            i.SetInstance({
                writeHead: () => (undefined), end: (result: string) => {
                    expect(result).toEqual(JSON.stringify({ success: true }));
                    expect(cookieLogoutCalled).toEqual(true);
                    done();
                },
            }, ServerResponse);
            await usingAsync(i.GetInstance(LogoutAction, true), async (c) => {
                await c.exec();
            });

        });
    });
});
