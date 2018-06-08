import { expect } from "chai";
import { RequestAction } from "../src/RequestAction";

class MockRequestAction extends RequestAction {
    public exec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public segmentName: string = "ExampleSegment";
}

export const requestActionTests = describe("RequestAction", () => {
    it("should be constructed", () => {
        const c = new MockRequestAction();
        expect(c).to.be.instanceof(RequestAction);
    });

    it("resolve should return a child on segment match", () => {
        const child = new MockRequestAction();
        const parent = new MockRequestAction(child);
        expect(parent.resolve(["ExampleSegment"], null as any, null as any)).to.be.eq(child);
    });

    it("resolve should return parent if a segment doesn't exists", () => {
        const child = new MockRequestAction();
        const parent = new MockRequestAction(child);
        expect(parent.resolve(["NotExistingSegment"], null as any, null as any)).to.be.eq(parent);
    });
});
