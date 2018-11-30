import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { ServerResponse } from "http";
import { UserContextService } from "../../src";
import { GetCurrentUser } from "../../src/Actions/GetCurrentUser";

export const getCurrentUserTests = describe("getCurrentUser", () => {

    it("exec", (done) => {
        const testUser = { Name: "Userke" };
        usingAsync(new Injector({ parent: undefined }), async (i) => {
            i.SetInstance({
                writeHead: () => (undefined), end: (result: string) => {
                    expect(result).toEqual(JSON.stringify(testUser));
                    done();
                },
            }, ServerResponse);
            i.SetInstance({ getCurrentUser: async () => (testUser) }, UserContextService);
            await usingAsync(i.GetInstance(GetCurrentUser, true), async (c) => {
                await c.exec();
            });
        });
    });
});
