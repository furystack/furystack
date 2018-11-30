import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { IncomingMessage, ServerResponse } from "http";
import { ErrorAction } from "../../src";

export const errorActionTests = describe("ErrorAction tests", () => {
    it("exec", (done) => {
        usingAsync(new Injector({ parent: undefined }), async (i) => {
            i.SetInstance({}, IncomingMessage);
            i.SetInstance({}, ServerResponse);
            await usingAsync(i.GetInstance(ErrorAction, true), async (e) => {
                try {
                    await e.exec();
                    done("Should throw");
                } catch (error) {
                    done();
                }
            });
        });
    });

    it("returnError", (done) => {
        const testError = { message: ":(" };
        usingAsync(new Injector({ parent: undefined }), async (i) => {
            i.SetInstance({}, IncomingMessage);
            i.SetInstance({
                writeHead: () => (undefined), end: (result: string) => {
                    expect(result).toEqual(JSON.stringify(testError));
                    done();
                },
            }, ServerResponse);
            await usingAsync(i.GetInstance(ErrorAction, true), async (c) => {
                c.returnError(testError);
            });
        });
    });
});
