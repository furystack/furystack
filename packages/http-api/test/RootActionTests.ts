import { expect } from "chai";
import { RequestAction } from "../src/RequestAction";
import { RequestContext } from "../src/RequestContext";
import { RootAction } from "../src/RootAction";

export const rootActionTests = describe("RootActionAction", () => {
    it("should be constructed without parameters", () => {
        const c = new RootAction({});
        expect(c).to.be.instanceof(RootAction);
        expect(c.segmentName).to.be.eq("");
    });

    it("should return default in case of empty url or slashes", async () => {
        const c = new RootAction({
            default: {
                exec: async (_incoming, svResponse) => {
                    svResponse.writeHead(200, "Ok");
                    svResponse.write(JSON.stringify({ message: "Root" }));
                },
            } as Partial<RequestAction> as any,
        });
        const response = {
            writeHead: (code: number, message: string) => {
                expect(code).to.be.eq(200);
                expect(message).to.be.eq("Ok");
            },
            write: (body: string) => {
                expect(body).to.be.eq(JSON.stringify({ message: "Root" }));
            },
            end: () => undefined,
        };
        await c.exec({ url: "//" } as any, response as any, () => ({} as RequestContext));
        await c.exec({} as any, response as any, () => ({} as RequestContext));
    });

    it("should return 404 in case of non-existent URLs", async () => {
        const c = new RootAction({

        });
        const response = {
            writeHead: (code: number, message: string) => {
                expect(code).to.be.eq(404);
                expect(message).to.be.eq("NOT FOUND :(");
            },
            write: (body: string) => {
                expect(body).to.be.eq(JSON.stringify({ Error: "Content not found", url: "/notExists/" }));
            },
            end: () => undefined,
        };
        await c.exec({ url: "/notExists/" } as any, response as any, () => ({} as RequestContext));
    });
});
