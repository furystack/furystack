import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { IncomingMessage, ServerResponse } from "http";
import { IdentityService, Utils } from "../../src";
import { LoginAction } from "../../src/Actions/Login";
export const loginActionTests = describe("LoginAction", () => {
    /** */
    it("exec", (done) => {
        const testUser = { Name: "Userke" };
        usingAsync(new Injector({ parent: undefined }), async (i) => {
            i.SetInstance({ cookieLogin: async () => testUser }, IdentityService);
            i.SetInstance({}, IncomingMessage);
            i.SetInstance({ readPostBody: async () => ({}) }, Utils);
            i.SetInstance({
                writeHead: () => (undefined), end: (result: string) => {
                    expect(result).toEqual(JSON.stringify(testUser));
                    done();
                },
            }, ServerResponse);
            await usingAsync(i.GetInstance(LoginAction, true), async (c) => {
                await c.exec();
            });
        });
    });
});
