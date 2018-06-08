import { expect } from "chai";
import { ServerResponse } from "http";
import { RouteAction } from "../src/RouteAction";

export const routeActionTests = describe("RouteAction", () => {
    it("should be constructed without parameters", () => {
        const c = new RouteAction("");
        expect(c).to.be.instanceof(RouteAction);
    });

    it("exec should return all child segment names", (done: MochaDone) => {
        const c = new RouteAction("", {
            segmentName: "ExampleSegment",
        } as any);

        c.exec({ url: "/" } as any, {
            writeHead: (code: number) => expect(code).to.be.eq(200),
            write: (msg: string) => {
                const data = JSON.parse(msg);
                expect(data.actions.length).to.be.eq(1);
                expect(data.actions[0]).to.be.eq("ExampleSegment");
            },
            end: () => done(),
        } as any as ServerResponse);

    });
});
